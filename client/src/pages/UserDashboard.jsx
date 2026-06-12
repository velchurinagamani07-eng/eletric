import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Download, Edit3, FileText, Gift, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { coupons, mockBookings, statusColors } from '../data/catalog'
import PaymentReceipt from '../components/PaymentReceipt'
import { useAuthStore } from '../store/authStore'
import { currency, fullAddress } from '../utils/format'
import { generateBookingsPDF, generateReceiptPDF } from '../utils/generatePDF'
import { saveProfilePhotoURL } from '../utils/firebaseUploads'
import ImageUploader from '../components/ImageUploader'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', icon: FileText },
  { id: 'receipts', label: 'Receipts', icon: Download },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'coupons', label: 'Coupons', icon: Gift },
]

export default function UserDashboard({ initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [status, setStatus] = useState('all')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const user = useAuthStore((state) => state.user)
  const updateProfileLocal = useAuthStore((state) => state.updateProfileLocal)
  const logout = useAuthStore((state) => state.logout)

  const bookings = useMemo(
    () => mockBookings.filter((booking) => booking.userId === (user?.uid || 'demo-customer') || user?.role === 'admin'),
    [user],
  )

  const filteredBookings = status === 'all' ? bookings : bookings.filter((booking) => booking.status === status)
  const completed = bookings.filter((booking) => booking.status === 'completed').length
  const totalSpent = bookings
    .filter((booking) => booking.paymentStatus === 'success')
    .reduce((sum, booking) => sum + booking.amount, 0)

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

  return (
    <>
      <Helmet>
        <title>User Dashboard | Home Electric Services</title>
      </Helmet>

      <main className="bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">User Panel</p>
              <h1 className="mt-2 text-3xl font-extrabold text-gray-950 dark:text-white">Welcome, {user?.name || 'Customer'}</h1>
            </div>
            <button type="button" className="btn-secondary" onClick={logout}>
              <LogOut size={17} /> Logout
            </button>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[250px_1fr]">
            <aside className="h-fit rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-900">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
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
                    <div key={label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-500">{label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-gray-950 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
                  <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-bold text-gray-950 dark:text-white">My Bookings</h2>
                    <div className="flex gap-2">
                      <select className="field w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button type="button" className="btn-secondary" onClick={() => generateBookingsPDF(filteredBookings, 'my-bookings.pdf')}>
                        <Download size={17} /> Export
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {filteredBookings.map((booking) => (
                      <article key={booking.id} className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-gray-950 dark:text-white">{booking.serviceName}</h3>
                              <span className={`badge ${statusColors[booking.status]}`}>{booking.status}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              {booking.bookingId} | {booking.date} | {booking.timeSlot}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{fullAddress(booking.address)}</p>
                            {booking.workerName && (
                              <p className="mt-1 text-sm font-semibold text-blue-600">Assigned worker: {booking.workerName}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="btn-secondary" onClick={() => setSelectedReceipt(booking)}>
                              View receipt
                            </button>
                            <button type="button" className="btn-primary" onClick={() => generateReceiptPDF(booking)}>
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'receipts' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookings
                    .filter((booking) => booking.paymentStatus === 'success')
                    .map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                        <p className="font-bold text-gray-950 dark:text-white">{booking.bookingId}</p>
                        <p className="mt-1 text-sm text-gray-500">{booking.serviceName}</p>
                        <p className="mt-3 text-xl font-extrabold text-gray-950 dark:text-white">{currency(booking.amount)}</p>
                        <button type="button" className="btn-secondary mt-4" onClick={() => generateReceiptPDF(booking)}>
                          <Download size={17} /> Download
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === 'profile' && (
                <form
                  className="max-w-2xl rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const formData = new FormData(event.currentTarget)
                    updateProfileLocal({
                      name: formData.get('name'),
                      mobile: formData.get('mobile'),
                    })
                  }}
                >
                  <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
                    <Edit3 size={18} /> Profile
                  </h2>
                  <div className="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-white/5">
                    <ImageUploader
                      label="Upload profile photo"
                      aspectRatio="1 / 1"
                      currentImageUrl={user?.photoURL || ''}
                      folder={`customer-${user?.uid || 'profile'}`}
                      onUploadComplete={async (photoURL) => {
                        if (user?.uid) await saveProfilePhotoURL({ userId: user.uid, photoURL })
                        updateProfileLocal({ photoURL })
                        toast.success('Profile photo updated.')
                      }}
                    />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Full name</span>
                      <input name="name" className="field" defaultValue={user?.name || ''} />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Mobile</span>
                      <input name="mobile" className="field" defaultValue={user?.mobile || ''} />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</span>
                      <input className="field" value={user?.email || ''} readOnly />
                    </label>
                  </div>
                  <button type="submit" className="btn-primary mt-5">
                    Save Profile
                  </button>
                </form>
              )}

              {activeTab === 'coupons' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                      <p className="text-2xl font-black tracking-wide text-gray-950 dark:text-white">{coupon.code}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        {coupon.type === 'flat' ? `Rs. ${coupon.value} off` : `${coupon.value}% off`} | Min Rs. {coupon.minOrder}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-gray-400">Expires {coupon.expiresAt}</p>
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
