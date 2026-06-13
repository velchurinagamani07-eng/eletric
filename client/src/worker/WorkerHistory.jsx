import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { Download, FileText, Zap } from 'lucide-react'
import { generateBookingsPDF } from '../utils/generatePDF'
import { currency } from '../utils/format'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'

const statusPalette = {
  completed: '#16A34A',
  assigned: '#2563EB',
  confirmed: '#2563EB',
  pending: '#D97706',
  cancelled: '#DC2626',
  rejected: '#DC2626',
  'in-progress': '#7C3AED',
}

const monthLabel = (date) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date)

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function computeMonthlyStats(jobs) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: monthLabel(date),
      jobs: 0,
    }
  })

  jobs.forEach((job) => {
    const date = toDate(job.completedAt) || toDate(job.createdAt) || (job.date ? new Date(`${job.date}T00:00:00`) : null)
    if (!date) return
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const row = months.find((item) => item.key === key)
    if (row) row.jobs += 1
  })

  return months
}

function computeDailyStats(jobs) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = Array.from({ length: daysInMonth }, (_, index) => ({ day: String(index + 1), jobs: 0 }))

  jobs.forEach((job) => {
    const date = toDate(job.completedAt) || toDate(job.createdAt) || (job.date ? new Date(`${job.date}T00:00:00`) : null)
    if (!date || date.getFullYear() !== year || date.getMonth() !== month) return
    rows[date.getDate() - 1].jobs += 1
  })

  return rows.filter((row) => row.jobs > 0)
}

function computeStatusBreakdown(jobs) {
  const counts = jobs.reduce((acc, job) => {
    const status = job.status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([name, value]) => ({
    name: name.replace(/-/g, ' '),
    status: name,
    value,
  }))
}

export default function WorkerHistory() {
  const user = useAuthStore((state) => state.user)
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))

  useEffect(() => {
    if (!user?.uid || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setAllJobs([])
        setLoading(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const ref = query(
      collection(db, 'bookings'),
      where('workerUID', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setAllJobs(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        setLoading(false)
      },
      () => {
        setAllJobs([])
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user?.uid])

  const completedJobs = useMemo(() => allJobs.filter((job) => job.status === 'completed'), [allJobs])
  const monthlyData = useMemo(() => computeMonthlyStats(completedJobs), [completedJobs])
  const dailyData = useMemo(() => computeDailyStats(completedJobs), [completedJobs])
  const statusData = useMemo(() => computeStatusBreakdown(allJobs), [allJobs])
  const totalCompletedAmount = completedJobs.reduce((sum, job) => sum + Number(job.totalAmount ?? job.amount ?? 0), 0)

  if (loading) {
    return (
      <section className="card p-8 text-center">
        <p className="text-sm font-semibold text-gray-500">Loading your job history...</p>
      </section>
    )
  }

  if (completedJobs.length === 0) {
    return (
      <>
        <Helmet>
          <title>Job History | DP Home Electric Services</title>
        </Helmet>
        <section className="card p-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-primary">
            <Zap size={38} fill="currentColor" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-navy dark:text-white">No jobs completed yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Your job history will appear here once you complete your first assignment.
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Job History | DP Home Electric Services</title>
      </Helmet>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Completed jobs" value={completedJobs.length} />
          <Metric label="Total service value" value={currency(totalCompletedAmount)} />
          <Metric label="All assigned jobs" value={allJobs.length} />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <ChartCard title="Monthly Completed Jobs">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jobs" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Jobs By Status">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={86} label>
                  {statusData.map((row) => (
                    <Cell key={row.status} fill={statusPalette[row.status] || '#64748B'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Daily Completed Jobs">
            {dailyData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="jobs" fill="#16A34A33" stroke="#16A34A" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-[240px] place-items-center text-sm font-semibold text-gray-400">No completed jobs this month.</p>
            )}
          </ChartCard>
        </div>

        <div className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-bold text-navy dark:text-white">
              <FileText size={18} /> Job history
            </h2>
            <button type="button" className="btn-secondary" onClick={() => generateBookingsPDF(allJobs, 'worker-history.pdf')}>
              <Download size={17} /> Download PDF
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-3">Booking</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {allJobs.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-3 font-semibold text-navy dark:text-white">{booking.bookingId || booking.id}</td>
                    <td>{booking.serviceName}</td>
                    <td>{booking.date || '-'}</td>
                    <td className="capitalize">{String(booking.status || 'pending').replace(/-/g, ' ')}</td>
                    <td>{currency(booking.totalAmount ?? booking.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function Metric({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy dark:text-white">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-4">
      <h2 className="mb-4 font-bold text-navy dark:text-white">{title}</h2>
      {children}
    </div>
  )
}
