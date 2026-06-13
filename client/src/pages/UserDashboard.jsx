import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import {
  CalendarX,
  Download,
  Edit3,
  FileText,
  Gift,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import PaymentReceipt from '../components/PaymentReceipt'
import UpiPaymentCard from '../components/UpiPaymentCard'
import { useAuthStore } from '../store/authStore'
import { currency, fullAddress } from '../utils/format'
import { generateBookingsPDF, generateReceiptPDF } from '../utils/generatePDF'
import { db, isFirebaseConfigured } from '../firebase/config'
import { PAYMENT_METHOD, UPI_ID, isPaidStatus, paymentStatusLabel } from '../utils/upiPayment'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', icon: FileText },
  { id: 'receipts', label: 'Receipts', icon: Download },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'coupons', label: 'Coupons', icon: Gift },
]

const emptyAddress = {
  label: '',
  flat: '',
  street: '',
  landmark: '',
  city: '',
  pincode: '',
}

const cancellationReasons = [
  'Booked by mistake',
  'Need to reschedule',
  'Issue already fixed',
  'Price or timing concern',
]

const addMonths = (date, months) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const couponCode = () => `DP50${Math.random().toString(36).slice(2, 7).toUpperCase()}`

async function createRewardCoupon({ booking, user }) {
  if (!db || !isFirebaseConfigured || !user?.uid) return
  const bookingId = booking?.bookingId || booking?.id || Date.now()
  const id = `reward-${bookingId}-${Date.now()}`
  await setDoc(doc(db, 'coupons', id), {
    code: couponCode(),
    type: 'flat',
    value: 50,
    minOrder: 199,
    maxUses: 1,
    usedCount: 0,
    singleUse: true,
    isActive: true,
    assignedToUserId: user.uid,
    userId: user.uid,
    sourceBookingId: bookingId,
    expiresAt: addMonths(new Date(), 3).toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

function parseBookingStart(booking) {
  if (!booking?.date) return null
  const start = String(booking.timeSlot || '').split('-')[0]?.trim() || '11:59 PM'
  const parsed = new Date(`${booking.date} ${start}`)
  return Number.isNaN(parsed.getTime()) ? new Date(`${booking.date}T23:59:00`) : parsed
}

function canCancelBooking(booking) {
  if (!['pending', 'confirmed'].includes(booking?.status)) return false
  const start = parseBookingStart(booking)
  if (!start) return false
  return start.getTime() - Date.now() > 2 * 60 * 60 * 1000
}

export default function UserDashboard({ initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [status, setStatus] = useState('all')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [bookings, setBookings] = useState([])
  const [userCoupons, setUserCoupons] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(Boolean(db && isFirebaseConfigured))
  const [resubmitBooking, setResubmitBooking] = useState(null)
  const [screenshotURL, setScreenshotURL] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const user = useAuthStore((state) => state.user)
  const updateProfileLocal = useAuthStore((state) => state.updateProfileLocal)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    if (!user?.uid || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setBookings([])
        setLoadingBookings(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoadingBookings(true))
    const ref =
      user.role === 'admin' || user.role === 'superadmin'
        ? collection(db, 'bookings')
        : query(collection(db, 'bookings'), where('userId', '==', user.uid))
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setBookings(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        setLoadingBookings(false)
      },
      () => {
        setBookings([])
        setLoadingBookings(false)
      },
    )
    return unsubscribe
  }, [user?.role, user?.uid])

  useEffect(() => {
    if (!user?.uid || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setUserCoupons([]))
      return undefined
    }

    const unsubscribe = onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        const next = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((coupon) => {
            if (coupon.isActive === false) return false
            const assignedId = coupon.assignedToUserId || coupon.userId || ''
            return assignedId === user.uid || coupon.isGlobal === true || !assignedId
          })
        setUserCoupons(next)
      },
      () => setUserCoupons([]),
    )

    return unsubscribe
  }, [user?.uid])

  const filteredBookings = status === 'all' ? bookings : bookings.filter((booking) => booking.status === status)
  const completed = bookings.filter((booking) => booking.status === 'completed').length
  const totalSpent = bookings
    .filter((booking) => isPaidStatus(booking.paymentStatus))
    .reduce((sum, booking) => sum + Number(booking.totalAmount ?? booking.amount ?? 0), 0)
  const addressBook = useMemo(() => user?.addressBook || [], [user?.addressBook])

  const submitResubmission = async () => {
    if (!resubmitBooking) return
    if (!screenshotURL) {
      toast.error('Upload the payment screenshot.')
      return
    }

    setSubmittingPayment(true)
    try {
      if (!db || !isFirebaseConfigured) throw new Error('Database is not configured.')
      const bookingId = resubmitBooking.bookingId || resubmitBooking.id
      const paymentPayload = {
        bookingId,
        userId: user?.uid,
        amount: Number(resubmitBooking.totalAmount ?? resubmitBooking.amount ?? 0),
        customerName: resubmitBooking.customer || user?.name || 'Customer',
        screenshotURL,
        paymentMethod: PAYMENT_METHOD,
        paymentStatus: 'paid',
        upiId: UPI_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const paymentRef = await addDoc(collection(db, 'payments'), paymentPayload)
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentId: paymentRef.id,
        paymentMethod: PAYMENT_METHOD,
        paymentStatus: 'paid',
        status: 'confirmed',
        screenshotURL,
        paymentSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await createRewardCoupon({ booking: resubmitBooking, user }).catch(() => {})
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        role: 'admin',
        title: 'UPI payment received',
        body: `${paymentPayload.customerName} confirmed UPI payment for booking ${bookingId}.`,
        type: 'payment_paid',
        bookingId,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(() => {})
      setResubmitBooking(null)
      setScreenshotURL('')
      toast.success('Payment confirmed. Receipt is ready.')
    } catch (err) {
      toast.error(err.message || 'Unable to confirm payment.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const cancelBooking = async (booking) => {
    const reason = window.prompt(`Cancellation reason:\n${cancellationReasons.join('\n')}`, cancellationReasons[0])
    if (!reason) return
    try {
      await updateDoc(doc(db, 'bookings', booking.bookingId || booking.id), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Booking cancelled.')
    } catch (err) {
      toast.error(err.message || 'Unable to cancel booking.')
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await updateProfileLocal({
      name: String(formData.get('name') || '').trim(),
      birthday: String(formData.get('birthday') || ''),
    })
    toast.success('Profile updated.')
  }

  const addAddress = async (event) => {
    event.preventDefault()
    const hasAddress = addressForm.flat && addressForm.street && addressForm.city && addressForm.pincode
    if (!hasAddress) {
      toast.error('Add house, street, city and pincode.')
      return
    }
    const next = [...addressBook, { ...addressForm, id: `addr-${Date.now()}` }]
    await updateProfileLocal({ addressBook: next })
    setAddressForm(emptyAddress)
    toast.success('Address saved.')
  }

  const deleteAddress = async (addressId) => {
    const next = addressBook.filter((address) => address.id !== addressId)
    await updateProfileLocal({ addressBook: next })
    toast.success('Address deleted.')
  }

  if (selectedReceipt) {
    return (
      <div>
        <button type="button" className="btn-secondary mx-4 mt-6 sm:mx-6" onClick={() => setSelectedReceipt(null)}>
          Back to dashboard
        </button>
        <PaymentReceipt booking={selectedReceipt} />
      </div>
    )
  }

  if (resubmitBooking) {
    return (
      <main className="bg-surface py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <button type="button" className="btn-secondary mb-5" onClick={() => setResubmitBooking(null)}>
            Back to dashboard
          </button>
          <UpiPaymentCard
            booking={resubmitBooking}
            screenshotURL={screenshotURL}
            submitting={submittingPayment}
            onScreenshotUpload={setScreenshotURL}
            onSubmit={submitResubmission}
          />
        </div>
      </main>
    )
  }

  return (
    <>
      <Helmet>
        <title>User Dashboard | DP Home Electric Services</title>
      </Helmet>

      <main className="bg-surface py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="eyebrow">User Panel</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy dark:text-white">Welcome, {user?.name || 'Customer'}</h1>
            </div>
            <button type="button" className="btn-secondary" onClick={logout}>
              <LogOut size={17} /> Logout
            </button>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[250px_1fr]">
            <aside className="card h-fit p-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-amber'
                        : 'text-gray-600 hover:bg-primary-light hover:text-navy dark:text-gray-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                )
              })}
            </aside>

            <section>
              {activeTab === 'overview' && (
                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    ['Total bookings', bookings.length],
                    ['Completed jobs', completed],
                    ['Total spent', currency(totalSpent)],
                  ].map(([label, value]) => (
                    <div key={label} className="card p-5">
                      <p className="text-sm font-semibold text-gray-500">{label}</p>
                      <p className="mt-2 font-display text-3xl font-extrabold text-navy dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="card overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-surface-border p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-bold text-navy dark:text-white">My Bookings</h2>
                    <div className="flex gap-2">
                      <select className="field w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button type="button" className="btn-secondary" onClick={() => generateBookingsPDF(filteredBookings, 'my-bookings.pdf')}>
                        <Download size={17} /> Export
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {loadingBookings ? (
                      <p className="p-6 text-center text-sm font-semibold text-gray-500">Loading bookings...</p>
                    ) : filteredBookings.length === 0 ? (
                      <p className="p-6 text-center text-sm font-semibold text-gray-500">No bookings found.</p>
                    ) : filteredBookings.map((booking) => (
                      <article key={booking.id} className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-navy dark:text-white">{booking.serviceName}</h3>
                              <span className={`badge badge-${booking.status || 'pending'}`}>{booking.status}</span>
                              <span className={`badge ${paymentStatusClass(booking.paymentStatus)}`}>
                                {paymentStatusLabel(booking.paymentStatus)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              {booking.bookingId} | {booking.date} | {booking.timeSlot}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{fullAddress(booking.address)}</p>
                            {booking.workerName && (
                              <p className="mt-1 text-sm font-semibold text-blue-600">Assigned worker: {booking.workerName}</p>
                            )}
                            {booking.cancellationReason && (
                              <p className="mt-2 text-xs font-semibold text-red-600">Cancelled: {booking.cancellationReason}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {canCancelBooking(booking) && (
                              <button type="button" className="btn-danger" onClick={() => cancelBooking(booking)}>
                                <CalendarX size={16} /> Cancel Booking
                              </button>
                            )}
                            <button type="button" className="btn-secondary" disabled={!isPaidStatus(booking.paymentStatus)} onClick={() => setSelectedReceipt(booking)}>
                              View Receipt
                            </button>
                            <button type="button" className="btn-primary" disabled={!isPaidStatus(booking.paymentStatus)} onClick={() => generateReceiptPDF(booking)}>
                              Download PDF
                            </button>
                            {booking.paymentStatus === 'rejected' && (
                              <button type="button" className="btn-secondary" onClick={() => setResubmitBooking(booking)}>
                                Resubmit Payment
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'receipts' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookings.filter((booking) => isPaidStatus(booking.paymentStatus)).length === 0 ? (
                    <p className="card p-8 text-center text-sm font-semibold text-gray-500 sm:col-span-2">No receipts yet.</p>
                  ) : bookings
                    .filter((booking) => isPaidStatus(booking.paymentStatus))
                    .map((booking) => (
                      <div key={booking.id} className="card p-5">
                        <p className="font-bold text-navy dark:text-white">{booking.bookingId}</p>
                        <p className="mt-1 text-sm text-gray-500">{booking.serviceName}</p>
                        <p className="mt-3 text-xl font-extrabold text-navy dark:text-white">{currency(booking.totalAmount ?? booking.amount)}</p>
                        <button type="button" className="btn-secondary mt-4" onClick={() => generateReceiptPDF(booking)}>
                          <Download size={17} /> Download
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                  <form className="card p-5" onSubmit={saveProfile}>
                    <h2 className="flex items-center gap-2 font-bold text-navy dark:text-white">
                      <Edit3 size={18} /> Profile
                    </h2>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-extrabold text-white shadow-amber">
                        {(user?.name || 'C').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-navy dark:text-white">Initials avatar</p>
                        <p className="text-sm text-gray-500">Profile photos are disabled for customer accounts.</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Full name</span>
                        <input name="name" className="field" defaultValue={user?.name || ''} />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Birthday</span>
                        <input name="birthday" type="date" className="field" defaultValue={user?.birthday || ''} />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Mobile</span>
                        <input className="field" value={user?.mobile || ''} readOnly />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</span>
                        <input className="field" value={user?.email || ''} readOnly />
                      </label>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="submit" className="btn-primary">Save Profile</button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          if (!user?.email) return toast.error('Email is required.')
                          await resetPassword(user.email)
                          toast.success('Password reset link sent.')
                        }}
                      >
                        <KeyRound size={16} /> Change Password
                      </button>
                    </div>
                  </form>

                  <section className="card p-5">
                    <h2 className="flex items-center gap-2 font-bold text-navy dark:text-white">
                      <MapPin size={18} /> Saved Addresses
                    </h2>
                    <form onSubmit={addAddress} className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        ['label', 'Label'],
                        ['flat', 'Flat / House no.'],
                        ['street', 'Street / Area'],
                        ['landmark', 'Landmark'],
                        ['city', 'City'],
                        ['pincode', 'Pincode'],
                      ].map(([field, label]) => (
                        <label key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
                          <input
                            className="field"
                            value={addressForm[field]}
                            onChange={(event) => setAddressForm((current) => ({ ...current, [field]: event.target.value }))}
                          />
                        </label>
                      ))}
                      <button type="submit" className="btn-secondary sm:col-span-2">
                        <Plus size={16} /> Add Address
                      </button>
                    </form>
                    <div className="mt-5 grid gap-3">
                      {addressBook.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-surface-border p-5 text-center text-sm text-gray-500">
                          No saved addresses yet.
                        </p>
                      ) : addressBook.map((address) => (
                        <article key={address.id} className="flex items-start justify-between gap-3 rounded-2xl border border-surface-border p-4">
                          <div>
                            <p className="font-bold text-navy dark:text-white">{address.label || 'Saved address'}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">{fullAddress(address)}</p>
                          </div>
                          <button type="button" className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => deleteAddress(address.id)}>
                            <Trash2 size={16} />
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'coupons' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {userCoupons.length === 0 ? (
                    <div className="card p-8 text-center sm:col-span-2">
                      <Gift className="mx-auto text-primary" size={34} />
                      <p className="mt-3 font-bold text-navy dark:text-white">No coupons yet.</p>
                      <p className="mt-1 text-sm text-gray-500">Complete a booking to earn your first coupon!</p>
                    </div>
                  ) : userCoupons.map((coupon) => (
                    <div key={coupon.id} className="card p-5">
                      <p className="font-mono text-2xl font-black tracking-wide text-navy dark:text-white">{coupon.code}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        {coupon.type === 'flat' ? `Rs. ${coupon.value} off` : `${coupon.value}% off`} | Min Rs. {coupon.minOrder || 0}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-gray-400">Expires {coupon.expiresAt || 'soon'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

function paymentStatusClass(status) {
  if (isPaidStatus(status)) return 'badge-paid'
  if (status === 'rejected') return 'badge-rejected'
  if (status === 'pending_verification') return 'badge-pending-payment'
  return 'bg-gray-100 text-gray-700'
}
