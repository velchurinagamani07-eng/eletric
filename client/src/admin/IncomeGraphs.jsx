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
import { incomeRows } from '../data/catalog'
import { generateIncomeReportPDF } from '../utils/generatePDF'

const yearlyRows = [
  { year: '2023', revenue: 420000, target: 450000 },
  { year: '2024', revenue: 680000, target: 650000 },
  { year: '2025', revenue: 910000, target: 850000 },
  { year: '2026', revenue: 1180000, target: 1200000 },
]

const categoryRows = [
  { name: 'Fans', value: 32, color: '#F59E0B' },
  { name: 'Wiring', value: 28, color: '#3B82F6' },
  { name: 'Sockets', value: 18, color: '#10B981' },
  { name: 'MCB', value: 12, color: '#EF4444' },
  { name: 'Other', value: 10, color: '#6B7280' },
]

export default function IncomeGraphs() {
  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-950 dark:text-white">Income & Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Filter-ready reporting surface for revenue, categories and workers.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => generateIncomeReportPDF(incomeRows)}>
          <Download size={17} /> Export PDF
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Monthly income">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={incomeRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yearly income target">
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={yearlyRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
              <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Income by service category">
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
        </ChartCard>

        <ChartCard title="Worker-wise earnings">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={[
              { worker: 'Suresh', earnings: 24000, jobs: 42 },
              { worker: 'Imran', earnings: 21000, jobs: 35 },
              { worker: 'Prakash', earnings: 18500, jobs: 31 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="worker" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="earnings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="jobs" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
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

