import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { doc, getDoc } from 'firebase/firestore'
import PaymentReceipt from '../components/PaymentReceipt'
import { db, isFirebaseConfigured } from '../firebase/config'

export default function ReceiptPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))

  useEffect(() => {
    let cancelled = false
    async function loadReceipt() {
      if (!bookingId || !db || !isFirebaseConfigured) {
        setLoading(false)
        return
      }
      setLoading(true)
      const snap = await getDoc(doc(db, 'bookings', bookingId)).catch(() => null)
      if (!cancelled) {
        setBooking(snap?.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      }
    }
    loadReceipt()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Loading receipt...</h1>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Helmet>
          <title>Receipt Not Found | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        </Helmet>
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Receipt not found</h1>
        <Link to="/services" className="btn-primary mt-5">
          Browse Services
        </Link>
      </main>
    )
  }

  return (
    <>
      <Helmet>
        <title>Receipt {booking.bookingId} | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content={`Service receipt for ${booking.serviceName} booking ${booking.bookingId}.`} />
      </Helmet>
      <PaymentReceipt booking={booking} />
    </>
  )
}
