import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, CreditCard, MapPin, Tag } from 'lucide-react'
import CouponInput from '../components/CouponInput'
import UpiPaymentCard from '../components/UpiPaymentCard'
import { timeSlots } from '../data/catalog'
import { useAuthStore } from '../store/authStore'
import { currency, nextBookingId, todayISO } from '../utils/format'
import { PAYMENT_METHOD, UPI_ID } from '../utils/upiPayment'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useServices } from '../hooks/useServices'

const steps = [
  'Service',
  'Address',
  'Date & Time',
  'Review',
  'Payment',
]

const emptyAddress = {
  flat: '',
  street: '',
  landmark: '',
  city: '',
  pincode: '',
}

function estimatedArrivalWindow(slot = '') {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return 'Within your selected time slot'
  const [, hourText, minuteText, meridiem] = match
  let hours = Number(hourText)
  const minutes = Number(minuteText)
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0
  const start = new Date()
  start.setHours(hours, minutes, 0, 0)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const format = (value) => value.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${format(start)} - ${format(end)}`
}

export default function Booking() {
  const [params] = useSearchParams()
  const { serviceId } = useParams()
  const { services } = useServices({ onlyActive: true })
  const requestedServiceId = serviceId || params.get('service') || ''
  const [step, setStep] = useState(0)
  const [selectedServiceId, setSelectedServiceId] = useState(requestedServiceId)
  const [address, setAddress] = useState(emptyAddress)
  const [date, setDate] = useState(todayISO())
  const [timeSlot, setTimeSlot] = useState(timeSlots[1])
  const [coupon, setCoupon] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [paying, setPaying] = useState(false)
  const [paymentBooking, setPaymentBooking] = useState(null)
  const [paymentScreenshotURL, setPaymentScreenshotURL] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const user = useAuthStore((state) => state.user)

  const selectedService = useMemo(
    () =>
      services.find((service) => service.id === selectedServiceId || service.slug === selectedServiceId) ||
      services.find((service) => service.id === requestedServiceId || service.slug === requestedServiceId) ||
      services[0],
    [requestedServiceId, selectedServiceId, services],
  )
  useEffect(() => {
    if (!selectedService?.id || selectedServiceId === selectedService.id) return
    Promise.resolve().then(() => setSelectedServiceId(selectedService.id))
  }, [selectedService?.id, selectedServiceId])
  const total = Math.max(selectedService.basePrice - discount, 0)
  const arrivalWindow = useMemo(() => estimatedArrivalWindow(timeSlot), [timeSlot])

  const createRewardCoupon = async (booking) => {
    const bookingId = booking?.bookingId || booking?.id || Date.now()
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 3)
    await setDoc(doc(db, 'coupons', `reward-${bookingId}-${Date.now()}`), {
      code: `DP50${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      type: 'flat',
      value: 50,
      minOrder: 199,
      maxUses: 1,
      usedCount: 0,
      singleUse: true,
      isActive: true,
      assignedToUserId: user?.uid,
      userId: user?.uid,
      sourceBookingId: bookingId,
      expiresAt: expiresAt.toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const canContinue =
    step === 0
      ? Boolean(selectedService)
      : step === 1
        ? address.flat && address.street && address.city && address.pincode
        : step === 2
          ? date && timeSlot
          : true

  const createBookingForUpi = async () => {
    if (!selectedService) {
      toast.error('Select a service before payment.')
      return
    }
    setPaying(true)
    const bookingId = nextBookingId()
    const booking = {
      id: bookingId,
      bookingId,
      userId: user?.uid,
      customer: user?.name || 'Customer',
      mobile: user?.mobile || '',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      category: selectedService.category,
      workerUID: null,
      status: 'pending',
      address,
      date,
      timeSlot,
      estimatedArrival: arrivalWindow,
      amount: total,
      totalAmount: total,
      subtotalAmount: selectedService.basePrice,
      discountAmount: discount,
      couponCode: coupon?.code || '',
      paymentId: '',
      paymentMethod: PAYMENT_METHOD,
      paymentStatus: 'awaiting_payment',
      upiId: UPI_ID,
      bookingStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      if (!db || !isFirebaseConfigured) throw new Error('Database is not configured. Please contact support.')

      await setDoc(doc(db, 'bookings', bookingId), {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setPaymentBooking(booking)
      setPaymentScreenshotURL('')
      toast.success('Booking saved. Complete the UPI payment and submit proof.')
    } catch (error) {
      toast.error(error.message || 'Booking could not be created.')
    } finally {
      setPaying(false)
    }
  }

  const submitPaymentProof = async () => {
    if (!paymentBooking) return
    if (!paymentScreenshotURL) {
      toast.error('Upload the payment screenshot.')
      return
    }

    setSubmittingPayment(true)
    try {
      if (!db || !isFirebaseConfigured) throw new Error('Database is not configured. Please contact support.')
      const bookingId = paymentBooking.bookingId || paymentBooking.id
      const paymentPayload = {
        bookingId,
        userId: user?.uid,
        amount: Number(paymentBooking.totalAmount ?? paymentBooking.amount ?? 0),
        customerName: paymentBooking.customer || user?.name || 'Customer',
        screenshotURL: paymentScreenshotURL,
        paymentMethod: PAYMENT_METHOD,
        paymentStatus: 'paid',
        upiId: UPI_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const paymentRef = await addDoc(collection(db, 'payments'), paymentPayload)
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
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentId: paymentRef.id,
        paymentMethod: PAYMENT_METHOD,
        paymentStatus: 'paid',
        status: 'confirmed',
        screenshotURL: paymentScreenshotURL,
        paymentSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await createRewardCoupon(paymentBooking).catch(() => {})
      setPaymentBooking({
        ...paymentBooking,
        paymentId: paymentRef.id,
        paymentMethod: PAYMENT_METHOD,
        paymentStatus: 'paid',
        status: 'confirmed',
        screenshotURL: paymentScreenshotURL,
      })
      toast.success('Payment confirmed. Your receipt is ready.')
    } catch (error) {
      toast.error(error.message || 'Unable to submit payment proof.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Book Electrical Service | DP Home Electric Services</title>
        <meta name="description" content="Book a home electrical service with address, date, time slot, coupon and direct UPI payment." />
      </Helmet>

      <main className="bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link to="/services" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-amber-600 dark:text-gray-300">
            <ArrowLeft size={17} /> Back to services
          </Link>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <h1 className="text-lg font-extrabold text-gray-950 dark:text-white">Book a Service</h1>
              <div className="mt-5 grid gap-2">
                {steps.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                      step === index
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100'
                        : index < step
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-500'
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow-sm dark:bg-gray-950">
                      {index < step ? <CheckCircle2 size={15} /> : index + 1}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </aside>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-7">
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white">Select service</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {services.map((service) => (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`rounded-lg border p-3 text-left transition ${
                          selectedServiceId === service.id
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                            : 'border-gray-200 hover:border-amber-200 dark:border-white/10'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img src={service.imageURL} alt="" className="h-16 w-16 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-gray-950 dark:text-white">{service.name}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">{service.duration}</p>
                            <p className="mt-1 text-sm font-extrabold text-amber-600">{currency(service.basePrice)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-950 dark:text-white">
                    <MapPin className="text-amber-600" /> Address
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[
                      ['flat', 'Flat / House no.'],
                      ['street', 'Street / Area'],
                      ['landmark', 'Landmark'],
                      ['city', 'City'],
                      ['pincode', 'Pincode'],
                    ].map(([field, label]) => (
                      <label key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                        <input
                          className="field"
                          value={address[field]}
                          onChange={(event) => setAddress((value) => ({ ...value, [field]: event.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-950 dark:text-white">
                    <CalendarDays className="text-blue-600" /> Date & time
                  </h2>
                  <label className="mt-5 block max-w-xs">
                    <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Service date</span>
                    <DatePicker
                      selected={date ? new Date(`${date}T00:00:00`) : new Date()}
                      onChange={(nextDate) => setDate(nextDate.toISOString().slice(0, 10))}
                      minDate={new Date()}
                      className="field"
                      dateFormat="yyyy-MM-dd"
                    />
                  </label>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setTimeSlot(slot)}
                        className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                          timeSlot === slot
                            ? 'border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200'
                            : 'border-gray-200 text-gray-600 hover:border-blue-200 dark:border-white/10 dark:text-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 dark:border-white/10">
                    <p className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">
                      Estimated electrician arrival: <span className="font-black text-gray-950 dark:text-white">{arrivalWindow}</span>. Use support after booking if you need to share issue photos.
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-950 dark:text-white">
                    <Tag className="text-emerald-600" /> Review & coupon
                  </h2>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 p-4 dark:border-white/10">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Service</p>
                      <p className="mt-1 font-bold text-gray-950 dark:text-white">{selectedService.name}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{selectedService.shortDescription}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-4 dark:border-white/10">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Schedule</p>
                      <p className="mt-1 font-bold text-gray-950 dark:text-white">{date}</p>
                      <p className="mt-2 text-sm text-gray-500">{timeSlot}</p>
                      <p className="mt-1 text-sm font-semibold text-amber-700">ETA {arrivalWindow}</p>
                    </div>
                  </div>
                  <div className="mt-5 max-w-xl rounded-lg border border-gray-100 p-4 dark:border-white/10">
                    <p className="mb-3 text-sm font-black text-gray-950 dark:text-white">Apply coupon</p>
                    <CouponInput amount={selectedService.basePrice} onApply={(nextCoupon, nextDiscount) => {
                      setCoupon(nextCoupon)
                      setDiscount(nextDiscount)
                    }} />
                    <p className="mt-3 text-xs font-semibold text-gray-500">Coupons are validated against active offers on your account.</p>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-lg border border-gray-100 dark:border-white/10">
                    {[
                      ['Base price', currency(selectedService.basePrice)],
                      ['Discount', `-${currency(discount)}`],
                      ['Final total', currency(total)],
                    ].map(([label, value], index) => (
                      <div
                        key={label}
                        className={`flex items-center justify-between px-4 py-3 text-sm ${
                          index === 2
                            ? 'bg-amber-50 font-extrabold text-gray-950 dark:bg-amber-500/10 dark:text-white'
                            : 'border-b border-gray-100 text-gray-600 dark:border-white/10 dark:text-gray-300'
                        }`}
                      >
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-950 dark:text-white">
                    <CreditCard className="text-emerald-600" /> Payment
                  </h2>
                  {paymentBooking?.paymentStatus === 'paid' ? (
                    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <p className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-100">
                        <CheckCircle2 size={19} /> Booking confirmed
                      </p>
                      <p className="mt-2 text-sm leading-7 text-emerald-900/80 dark:text-emerald-100/80">
                        Your booking {paymentBooking.bookingId} is confirmed. Your receipt is available in the dashboard, and a Rs. 50 coupon has been added to your account.
                      </p>
                      <Link to="/dashboard/bookings" className="btn-primary mt-4">
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : paymentBooking ? (
                    <div className="mt-5">
                      <UpiPaymentCard
                        booking={paymentBooking}
                        screenshotURL={paymentScreenshotURL}
                        submitting={submittingPayment}
                        onScreenshotUpload={setPaymentScreenshotURL}
                        onSubmit={submitPaymentProof}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
                        Your booking will be saved first. Then scan the UPI QR code, pay manually from any UPI app, and upload your payment screenshot. The receipt is generated immediately after upload.
                      </p>
                      <button type="button" className="btn-primary mt-6" disabled={paying} onClick={createBookingForUpi}>
                        {paying ? 'Saving booking...' : `Create Booking & Pay ${currency(total)}`}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-white/10">
                <button type="button" className="btn-secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(value - 1, 0))}>
                  Back
                </button>
                {step < steps.length - 1 && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!canContinue}
                    onClick={() => {
                      if (!canContinue) {
                        toast.error('Complete the required fields first.')
                        return
                      }
                      setStep((value) => Math.min(value + 1, steps.length - 1))
                    }}
                  >
                    Continue <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
