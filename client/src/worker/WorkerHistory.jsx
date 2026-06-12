import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { generateBookingsPDF } from '../utils/generatePDF'
import { mockBookings } from '../data/catalog'

const monthlyJobs = [
  { month: 'Jan', jobs: 18 },
  { month: 'Feb', jobs: 23 },
  { month: 'Mar', jobs: 21 },
  { month: 'Apr', jobs: 28 },
  { month: 'May', jobs: 34 },
  { month: 'Jun', jobs: 12 },
]

const dailyJobs = [
  { day: '1', jobs: 2 },
  { day: '5', jobs: 4 },
  { day: '10', jobs: 3 },
  { day: '15', jobs: 5 },
  { day: '20', jobs: 6 },
  { day: '25', jobs: 4 },
]

const statusRows = [
  { name: 'Completed', value: 72 },
  { name: 'In progress', value: 16 },
  { name: 'Cancelled', value: 4 },
]

export default function WorkerHistory() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard title="Monthly Jobs">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyJobs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Jobs By Status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusRows} dataKey="value" nameKey="name" outerRadius={86} fill="#3B82F6" label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily Jobs">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyJobs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="jobs" fill="#10B98133" stroke="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-950 dark:text-white">Job history</h2>
          <button type="button" className="btn-secondary" onClick={() => generateBookingsPDF(mockBookings, 'worker-history.pdf')}>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {mockBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="py-3 font-semibold text-gray-950 dark:text-white">{booking.bookingId}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.date}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <h2 className="mb-4 font-bold text-gray-950 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}

