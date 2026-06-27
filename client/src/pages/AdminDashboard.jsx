import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { ArrowRight, CalendarClock, CheckCircle2, IndianRupee, ShieldAlert, Timer, Users } from 'lucide-react'
import { currency, todayISO } from '../utils/format'
import { db, isFirebaseConfigured } from '../firebase/config'

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isSameMonth = (date, now = new Date()) =>
  date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const today = todayISO()

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setLoading(false))
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        setBookings(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        setLoading(false)
      },
      () => {
        setBookings([])
        setLoading(false)
      },
    )
    const unsubWorkers = onSnapshot(
      query(collection(db, 'workers'), where('isActive', '==', true)),
      (snapshot) => setWorkers(snapshot.docs.map((entry) => ({ id: entry.id, uid: entry.id, ...entry.data() }))),
      () => setWorkers([]),
    )

    return () => {
      unsubBookings()
      unsubWorkers()
    }
  }, [])

  const stats = useMemo(() => {
    const paid = bookings.filter((booking) => booking.paymentStatus === 'paid' || booking.paymentStatus === 'success')
    const totalRevenue = paid.reduce((sum, booking) => sum + Number(booking.totalAmount ?? booking.amount ?? 0), 0)
    const monthRevenue = paid
      .filter((booking) => isSameMonth(toDate(booking.createdAt) || (booking.date ? new Date(`${booking.date}T00:00:00`) : null)))
      .reduce((sum, booking) => sum + Number(booking.totalAmount ?? booking.amount ?? 0), 0)
    const todayBookings = bookings.filter((booking) => booking.date === today)
    const pendingVerify = bookings.filter((booking) => booking.paymentStatus === 'pending_verification').length

    return { totalRevenue, monthRevenue, todayBookings, pendingVerify }
  }, [bookings, today])

  const workerRows = useMemo(
    () =>
      workers.map((worker) => {
        const workerId = worker.uid || worker.id
        const assigned = bookings.filter((booking) => booking.workerUID === workerId)
        const completed = assigned.filter((booking) => booking.status === 'completed')
        return {
          ...worker,
          jobsToday: assigned.filter((booking) => booking.date === today).length,
          jobsThisMonth: completed.filter((booking) => isSameMonth(toDate(booking.completedAt) || toDate(booking.createdAt) || (booking.date ? new Date(`${booking.date}T00:00:00`) : null))).length,
          completed: completed.length,
        }
      }).sort((a, b) => b.jobsThisMonth - a.jobsThisMonth || b.jobsToday - a.jobsToday),
    [bookings, today, workers],
  )

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | DP Home Electric Services</title>
      </Helmet>
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Total Revenue" value={currency(stats.totalRevenue)} helper="All paid bookings" icon={IndianRupee} tone="text-emerald-600" />
          <Kpi label="This Month" value={currency(stats.monthRevenue)} helper="Paid this month" icon={CheckCircle2} tone="text-blue-600" />
          <Kpi label="Today" value={`${stats.todayBookings.length} bookings`} helper="Real-time schedule" icon={CalendarClock} tone="text-primary" />
          <Kpi label="Pending" value={`${stats.pendingVerify} verify`} helper="Needs action" icon={ShieldAlert} tone="text-red-600" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Recent bookings</h2>
              <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
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
                    <th>Payment</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {loading ? (
                    <tr>
                      <td className="py-5 text-center text-gray-500" colSpan="6">Loading bookings...</td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td className="py-5 text-center text-gray-500" colSpan="6">No bookings found.</td>
                    </tr>
                  ) : bookings.slice(0, 7).map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-3 font-semibold text-white">{booking.bookingId || booking.id}</td>
                      <td>{booking.customer || '-'}</td>
                      <td>{booking.serviceName || '-'}</td>
                      <td className="capitalize">{String(booking.status || 'pending').replace(/-/g, ' ')}</td>
                      <td className="capitalize">{String(booking.paymentStatus || 'pending').replace(/_/g, ' ')}</td>
                      <td>{currency(booking.totalAmount ?? booking.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="flex items-center gap-2 font-bold text-white">
              <Users size={18} /> Worker Performance
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-3">Worker</th>
                    <th>Today</th>
                    <th>This Month</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {workerRows.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-gray-500" colSpan="4">No active workers found.</td>
                    </tr>
                  ) : workerRows.map((worker) => (
                    <tr key={worker.uid || worker.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {worker.photoURL ? (
                            <img
                              src={worker.photoURL || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'
                              }}
                              className="h-10 w-10 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-extrabold text-white">
                              {worker.name?.slice(0, 1)?.toUpperCase() || 'W'}
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-white">{worker.name || 'Worker'}</p>
                            <p className="text-xs text-gray-500">{worker.specialization || 'Electrical services'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{worker.jobsToday}</td>
                      <td>{worker.jobsThisMonth}</td>
                      <td>{worker.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['New Booking', '/booking'],
            ['Add Service', '/admin/services'],
            ['Assign Worker', '/admin/bookings'],
            ['Add Worker', '/admin/workers'],
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

function Kpi({ label, value, helper, icon: Icon, tone }) {
  return (
    <div className="card p-5">
      <Icon className={tone} size={22} />
      <p className="mt-3 text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-400">
        <Timer size={13} /> {helper}
      </p>
    </div>
  )
}
