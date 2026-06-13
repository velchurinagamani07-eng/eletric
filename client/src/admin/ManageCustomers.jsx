import { Copy, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { currency } from '../utils/format'

export default function ManageCustomers() {
  const { items, loading, error } = useFirestoreCollection('users', [])
  const customers = items.filter((user) => ['user', 'customer'].includes(user.role))

  const copyUid = async (uid) => {
    await navigator.clipboard?.writeText(uid)
    toast.success('Firebase UID copied.')
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-white/10">
        <h2 className="font-bold text-gray-950 dark:text-white">Manage Customers</h2>
        <p className="mt-1 text-sm text-gray-500">Customer and user accounts loaded from Firestore.</p>
        {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th>Mobile</th>
              <th>Bookings</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>UID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`customer-skeleton-${index}`}>
                  <td className="px-4 py-3" colSpan={6}>
                    <div className="h-10 skeleton-shimmer rounded-lg" />
                  </td>
                </tr>
              ))
            ) : customers.map((customer) => (
              <tr key={customer.uid}>
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-950 dark:text-white">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </td>
                <td>{customer.mobile || '-'}</td>
                <td>{customer.totalBookings || 0}</td>
                <td>{currency(customer.totalSpent || 0)}</td>
                <td>{customer.isActive !== false ? 'Active' : 'Inactive'}</td>
                <td>
                  <button type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => copyUid(customer.uid)}>
                    <Copy size={14} /> Copy UID
                  </button>
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                  <FileText className="mx-auto mb-2 text-gray-300" size={34} />
                  No customer-role users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
