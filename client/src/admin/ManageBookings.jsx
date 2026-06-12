import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, FileText, MessageCircle, Send, UserPlus } from 'lucide-react'
import { statusColors } from '../data/catalog'
import { currency, fullAddress } from '../utils/format'
import { generateBookingsPDF, generateReceiptPDF } from '../utils/generatePDF'
import { updateBookingStatus } from '../utils/firebaseUploads'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { useServices } from '../hooks/useServices'

export default function ManageBookings() {
  const { items: bookings, setItems: setBookings, loading, error } = useFirestoreCollection('bookings', [], 'createdAt')
  const { items: workerItems } = useFirestoreCollection('workers', [], 'createdAt')
  const { allServices } = useServices({ onlyActive: false })
  const [status, setStatus] = useState('all')
  const [worker, setWorker] = useState('all')
  const [service, setService] = useState('all')

  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
        const statusMatch = status === 'all' || booking.status === status
        const workerMatch = worker === 'all' || booking.workerUID === worker
        const serviceMatch = service === 'all' || booking.serviceId === service
        return statusMatch && workerMatch && serviceMatch
      }),
    [bookings, status, worker, service],
  )

  const assignWorker = async (bookingId, workerUID) => {
    const selectedWorker = workerItems.find((item) => (item.uid || item.id) === workerUID)
    if (!selectedWorker) return
    try {
      await updateBookingStatus(bookingId, 'assigned', {
        workerUID,
        workerName: selectedWorker.name,
      })
      toast.success(`${selectedWorker.name} assigned.`)
    } catch (err) {
      toast.error(err.message || 'Unable to assign worker.')
      return
    }
      setBookings((items) =>
      items.map((item) =>
        item.id === bookingId || item.bookingId === bookingId
          ? { ...item, workerUID, workerName: selectedWorker?.name || '', status: 'assigned' }
          : item,
      ),
    )
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-bold text-gray-950 dark:text-white">Booking Management</h2>
        <div className="flex flex-wrap gap-2">
          <select className="field w-36" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select className="field w-40" value={worker} onChange={(event) => setWorker(event.target.value)}>
            <option value="all">All workers</option>
            {workerItems.map((item) => (
              <option key={item.uid || item.id} value={item.uid || item.id}>{item.name}</option>
            ))}
          </select>
          <select className="field w-40" value={service} onChange={(event) => setService(event.target.value)}>
            <option value="all">All services</option>
            {allServices.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={() => generateBookingsPDF(filtered, 'admin-bookings.pdf')}>
            <Download size={17} /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Date</th>
              <th>Worker</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan="8">Loading bookings...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan="8">No bookings found.</td>
              </tr>
            ) : filtered.map((booking) => {
              const workerMobile = workerItems.find((item) => (item.uid || item.id) === booking.workerUID)?.mobile || ''
              const details = `New Job Assignment\nCustomer: ${booking.customer}\nMobile: ${booking.mobile}\nAddress: ${fullAddress(booking.address)}\nService: ${booking.serviceName}\nDate: ${booking.date}\nTime: ${booking.timeSlot}`
              return (
                <tr key={booking.id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-gray-950 dark:text-white">{booking.bookingId}</td>
                  <td>{booking.customer}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.date}<br /><span className="text-xs text-gray-500">{booking.timeSlot}</span></td>
                  <td>
                    <select className="field w-40" value={booking.workerUID || ''} onChange={(event) => assignWorker(booking.id || booking.bookingId, event.target.value)}>
                      <option value="">Assign worker</option>
                      {workerItems.map((item) => (
                        <option key={item.uid || item.id} value={item.uid || item.id}>{item.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><span className={`badge ${statusColors[booking.status]}`}>{booking.status}</span></td>
                  <td>{currency(booking.totalAmount ?? booking.amount)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label="Assign worker"
                        onClick={() => assignWorker(booking.bookingId || booking.id, booking.workerUID || workerItems[0]?.uid || workerItems[0]?.id)}
                      >
                        <UserPlus size={16} />
                      </button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Download detail" onClick={() => generateReceiptPDF(booking)}><FileText size={16} /></button>
                      <a
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-emerald-50 dark:hover:bg-white/10"
                        aria-label="Send via WhatsApp"
                        href={`https://wa.me/91${workerMobile}?text=${encodeURIComponent(details)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={16} />
                      </a>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-white/10"
                        aria-label="Send in app"
                        onClick={() => toast.success(`In-app assignment notice prepared for ${booking.workerName || 'selected worker'}.`)}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
