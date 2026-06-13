import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDoc, doc } from 'firebase/firestore'
import { Download, Eye, FileText, MessageCircle, Search, Send, Trash2, UserPlus, X } from 'lucide-react'
import { statusColors } from '../data/catalog'
import { currency, fullAddress } from '../utils/format'
import { generateBookingsPDF, generateReceiptPDF } from '../utils/generatePDF'
import { updateBookingStatus } from '../utils/firebaseUploads'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { useServices } from '../hooks/useServices'
import { db, isFirebaseConfigured } from '../firebase/config'

export default function ManageBookings() {
  const { items: bookings, setItems: setBookings, loading, error } = useFirestoreCollection('bookings', [], 'createdAt')
  const { items: workerItems } = useFirestoreCollection('workers', [], 'createdAt')
  const { allServices } = useServices({ onlyActive: false })
  const [status, setStatus] = useState('all')
  const [worker, setWorker] = useState('all')
  const [service, setService] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [detailBooking, setDetailBooking] = useState(null)

  const workerActiveCounts = useMemo(() => {
    const activeStatuses = new Set(['confirmed', 'assigned', 'in-progress'])
    return bookings.reduce((map, booking) => {
      if (booking.workerUID && activeStatuses.has(booking.status)) {
        map.set(booking.workerUID, (map.get(booking.workerUID) || 0) + 1)
      }
      return map
    }, new Map())
  }, [bookings])

  const sortedWorkers = useMemo(
    () =>
      [...workerItems].sort((a, b) => {
        const aCount = workerActiveCounts.get(a.uid || a.id) || 0
        const bCount = workerActiveCounts.get(b.uid || b.id) || 0
        return aCount - bCount || String(a.name || '').localeCompare(String(b.name || ''))
      }),
    [workerActiveCounts, workerItems],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return bookings.filter((booking) => {
        const statusMatch = status === 'all' || booking.status === status
        const workerMatch = worker === 'all' || booking.workerUID === worker
        const serviceMatch = service === 'all' || booking.serviceId === service
        if (!needle) return statusMatch && workerMatch && serviceMatch
        const text = [
          booking.bookingId,
          booking.customer,
          booking.mobile,
          booking.serviceName,
          fullAddress(booking.address),
        ].join(' ').toLowerCase()
        return statusMatch && workerMatch && serviceMatch && text.includes(needle)
      })
  }, [bookings, status, worker, service, query])

  const filteredIds = filtered.map((booking) => booking.id || booking.bookingId)
  const selectedBookings = bookings.filter((booking) => selectedIds.includes(booking.id || booking.bookingId))

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

  const toggleSelected = (bookingId) => {
    setSelectedIds((current) => (current.includes(bookingId) ? current.filter((id) => id !== bookingId) : [...current, bookingId]))
  }

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const allSelected = filteredIds.length > 0 && filteredIds.every((id) => current.includes(id))
      return allSelected ? current.filter((id) => !filteredIds.includes(id)) : [...new Set([...current, ...filteredIds])]
    })
  }

  const bulkUpdateStatus = async (nextStatus) => {
    if (!selectedBookings.length) return
    try {
      await Promise.all(selectedBookings.map((booking) => updateBookingStatus(booking.id || booking.bookingId, nextStatus)))
      setBookings((items) => items.map((item) => (selectedIds.includes(item.id || item.bookingId) ? { ...item, status: nextStatus } : item)))
      setSelectedIds([])
      toast.success(`Updated ${selectedBookings.length} booking(s).`)
    } catch (err) {
      toast.error(err.message || 'Unable to update selected bookings.')
    }
  }

  const deleteBooking = async (booking) => {
    const bookingId = booking.id || booking.bookingId
    if (!window.confirm(`Delete booking ${booking.bookingId || booking.id}?`)) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'bookings', bookingId))
      setBookings((items) => items.filter((item) => (item.id || item.bookingId) !== bookingId))
      setSelectedIds((ids) => ids.filter((id) => id !== bookingId))
      toast.success('Booking deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete booking.')
    }
  }

  const bulkDelete = async () => {
    if (!selectedBookings.length || !window.confirm(`Delete ${selectedBookings.length} selected booking(s)?`)) return
    try {
      if (db && isFirebaseConfigured) {
        await Promise.all(selectedBookings.map((booking) => deleteDoc(doc(db, 'bookings', booking.id || booking.bookingId))))
      }
      setBookings((items) => items.filter((item) => !selectedIds.includes(item.id || item.bookingId)))
      setSelectedIds([])
      toast.success('Selected bookings deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete selected bookings.')
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-bold text-gray-950 dark:text-white">Booking Management</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="field w-56 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings" />
          </div>
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
            {sortedWorkers.map((item) => (
              <option key={item.uid || item.id} value={item.uid || item.id}>
                {item.name} ({workerActiveCounts.get(item.uid || item.id) || 0} active)
              </option>
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
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-white/10 dark:bg-amber-500/10 dark:text-amber-100">
          <span>{selectedIds.length} selected</span>
          <button type="button" className="btn-secondary px-3 py-2" onClick={() => bulkUpdateStatus('assigned')}>Mark assigned</button>
          <button type="button" className="btn-secondary px-3 py-2" onClick={() => bulkUpdateStatus('completed')}>Mark completed</button>
          <button type="button" className="btn-danger" onClick={bulkDelete}><Trash2 size={16} /> Delete selected</button>
          <button type="button" className="btn-secondary px-3 py-2" onClick={() => setSelectedIds([])}>Clear</button>
        </div>
      )}

      <div className="overflow-x-auto">
        {error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))} onChange={toggleAllVisible} aria-label="Select all visible bookings" />
              </th>
              <th>Booking</th>
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
                <td className="px-4 py-8 text-center text-gray-500" colSpan="9">Loading bookings...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan="9">No bookings found.</td>
              </tr>
            ) : filtered.map((booking) => {
              const workerMobile = workerItems.find((item) => (item.uid || item.id) === booking.workerUID)?.mobile || ''
              const details = `New Job Assignment\nCustomer: ${booking.customer}\nMobile: ${booking.mobile}\nAddress: ${fullAddress(booking.address)}\nService: ${booking.serviceName}\nDate: ${booking.date}\nTime: ${booking.timeSlot}`
              const bookingKey = booking.id || booking.bookingId
              return (
                <tr key={booking.id} className="align-top">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={selectedIds.includes(bookingKey)} onChange={() => toggleSelected(bookingKey)} aria-label={`Select booking ${booking.bookingId || booking.id}`} />
                  </td>
                  <td className="font-semibold text-gray-950 dark:text-white">{booking.bookingId}</td>
                  <td>{booking.customer}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.date}<br /><span className="text-xs text-gray-500">{booking.timeSlot}</span></td>
                  <td>
                    <select className="field w-48" value={booking.workerUID || ''} onChange={(event) => assignWorker(booking.id || booking.bookingId, event.target.value)}>
                      <option value="">Assign worker</option>
                      {sortedWorkers.map((item) => (
                        <option key={item.uid || item.id} value={item.uid || item.id}>
                          {item.name} ({workerActiveCounts.get(item.uid || item.id) || 0} active)
                        </option>
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
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="View booking details" onClick={() => setDetailBooking(booking)}><Eye size={16} /></button>
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
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete booking" onClick={() => deleteBooking(booking)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {detailBooking && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-gray-950/50" onClick={() => setDetailBooking(null)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl dark:bg-gray-950" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-600">Booking details</p>
                <h3 className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">{detailBooking.bookingId || detailBooking.id}</h3>
              </div>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setDetailBooking(null)} aria-label="Close booking details">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              {[
                ['Customer', detailBooking.customer || '-'],
                ['Mobile', detailBooking.mobile || '-'],
                ['Service', detailBooking.serviceName || '-'],
                ['Schedule', `${detailBooking.date || '-'} | ${detailBooking.timeSlot || '-'}`],
                ['Address', fullAddress(detailBooking.address)],
                ['Worker', detailBooking.workerName || 'To be assigned'],
                ['Status', detailBooking.status || 'pending'],
                ['Payment', detailBooking.paymentStatus || 'pending'],
                ['Amount', currency(detailBooking.totalAmount ?? detailBooking.amount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-100 p-3 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
