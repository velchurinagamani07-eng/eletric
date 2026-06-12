import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, CalendarClock, CheckCircle2, IndianRupee, Timer, Users } from 'lucide-react'
import { currency } from '../utils/format'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'

export default function AdminDashboard() {
  const { items: bookings, loading } = useFirestoreCollection('bookings', [], 'createdAt')
  const { items: workers } = useFirestoreCollection('workers', [], 'createdAt')
  const revenue = bookings
    .filter((booking) => booking.paymentStatus === 'paid')
    .reduce((sum, booking) => sum + Number(booking.totalAmount ?? booking.amount ?? 0), 0)
  const pending = bookings.filter((booking) => booking.status === 'pending').length
  const completed = bookings.filter((booking) => booking.status === 'completed').length

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Home Electric Services</title>
      </Helmet>
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Monthly revenue', currency(revenue), IndianRupee, 'text-emerald-600'],
            ['Total bookings', bookings.length, CalendarClock, 'text-blue-600'],
            ['Pending', pending, Timer, 'text-amber-600'],
            ['Completed', completed, CheckCircle2, 'text-emerald-600'],
          ].map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <Icon className={color} size={22} />
              <p className="mt-3 text-sm font-semibold text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-950 dark:text-white">Recent bookings</h2>
              <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                Manage <ArrowRight size={15} />
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-3">Booking</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {loading ? (
                    <tr>
                      <td className="py-5 text-center text-gray-500" colSpan="5">Loading bookings...</td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td className="py-5 text-center text-gray-500" colSpan="5">No bookings found.</td>
                    </tr>
                  ) : bookings.slice(0, 6).map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-3 font-semibold text-gray-950 dark:text-white">{booking.bookingId || booking.id}</td>
                      <td>{booking.customer}</td>
                      <td>{booking.serviceName}</td>
                      <td>{booking.status}</td>
                      <td>{currency(booking.totalAmount ?? booking.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
              <Users size={18} /> Worker leaderboard
            </h2>
            <div className="mt-4 grid gap-3">
              {[...workers]
                .sort((a, b) => Number(b.totalJobsCompleted || 0) - Number(a.totalJobsCompleted || 0))
                .map((worker) => (
                  <div key={worker.uid || worker.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <img src={worker.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-gray-950 dark:text-white">{worker.name}</p>
                        <p className="text-xs text-gray-500">{worker.specialization || worker.categories?.join?.(', ') || 'Electrical services'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-amber-700">{worker.totalJobsCompleted || 0}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Add Service', '/admin/services'],
            ['Assign Booking', '/admin/bookings'],
            ['Create Coupon', '/admin/coupons'],
          ].map(([label, to]) => (
            <Link key={label} to={to} className="btn-primary">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
