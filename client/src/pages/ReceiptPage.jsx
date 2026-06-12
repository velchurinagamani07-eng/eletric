import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PaymentReceipt from '../components/PaymentReceipt'
import { mockBookings } from '../data/catalog'

export default function ReceiptPage() {
  const { bookingId } = useParams()
  const booking = mockBookings.find((item) => item.bookingId === bookingId || item.id === bookingId)

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Helmet>
          <title>Receipt Not Found | Home Electric Services | Tuni, Andhra Pradesh</title>
        </Helmet>
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Receipt not found</h1>
        <Link to="/customer/bookings" className="btn-primary mt-5">
          Back to Bookings
        </Link>
      </main>
    )
  }

  return (
    <>
      <Helmet>
        <title>Receipt {booking.bookingId} | Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content={`Service receipt for ${booking.serviceName} booking ${booking.bookingId}.`} />
      </Helmet>
      <PaymentReceipt booking={booking} />
    </>
  )
}
