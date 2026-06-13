import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { generateIncomeReportPDF } from '../utils/generatePDF'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'

const colors = ['#F59E0B', '#2563EB', '#16A34A', '#DC2626', '#64748B', '#7C3AED']

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function IncomeGraphs() {
  const { items: bookings, loading, error } = useFirestoreCollection('bookings', [], 'createdAt')
  const { items: workers } = useFirestoreCollection('workers', [], 'createdAt')

  const paidBookings = useMemo(
    () => bookings.filter((booking) => ['paid', 'success'].includes(booking.paymentStatus)),
    [bookings],
  )

  const monthlyRows = useMemo(() => {
    const now = new Date()
    const rows = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date),
        revenue: 0,
        bookings: 0,
      }
    })
    paidBookings.forEach((booking) => {
      const date = toDate(booking.createdAt) || (booking.date ? new Date(`${booking.date}T00:00:00`) : null)
      if (!date) return
      const row = rows.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`)
      if (!row) return
      row.revenue += Number(booking.totalAmount ?? booking.amount ?? 0)
      row.bookings += 1
    })
    return rows
  }, [paidBookings])

  const yearlyRows = useMemo(() => {
    const byYear = paidBookings.reduce((acc, booking) => {
      const date = toDate(booking.createdAt) || (booking.date ? new Date(`${booking.date}T00:00:00`) : null)
      const year = date?.getFullYear?.()
      if (!year) return acc
      acc[year] = (acc[year] || 0) + Number(booking.totalAmount ?? booking.amount ?? 0)
      return acc
    }, {})
    return Object.entries(byYear).map(([year, revenue]) => ({ year, revenue }))
  }, [paidBookings])

  const categoryRows = useMemo(() => {
    const byCategory = paidBookings.reduce((acc, booking) => {
      const category = booking.category || 'Other'
      acc[category] = (acc[category] || 0) + Number(booking.totalAmount ?? booking.amount ?? 0)
      return acc
    }, {})
    return Object.entries(byCategory).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }))
  }, [paidBookings])

  const workerRows = useMemo(
    () =>
      workers.map((worker) => {
        const workerId = worker.uid || worker.id
        return {
          worker: worker.name || workerId,
          jobs: bookings.filter((booking) => booking.workerUID === workerId && booking.status === 'completed').length,
        }
      }).filter((row) => row.jobs > 0),
    [bookings, workers],
  )

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-950 dark:text-white">Income & Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Live reporting from paid bookings and completed jobs.</p>
          {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <button type="button" className="btn-primary" onClick={() => generateIncomeReportPDF(monthlyRows)}>
          <Download size={17} /> Export PDF
        </button>
      </div>

      {loading ? (
        <p className="card p-8 text-center text-sm font-semibold text-gray-500">Loading analytics...</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Monthly income">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Yearly income">
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={yearlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Income by service category">
            {categoryRows.length ? (
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie data={categoryRows} dataKey="value" nameKey="name" outerRadius={95} label>
                    {categoryRows.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <ChartCard title="Worker completed jobs">
            {workerRows.length ? (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={workerRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="worker" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#16A34A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>
        </div>
      )}
    </section>
  )
}

function EmptyChart() {
  return <p className="grid h-[290px] place-items-center text-sm font-semibold text-gray-400">No live data yet.</p>
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <h2 className="mb-4 font-bold text-gray-950 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}
