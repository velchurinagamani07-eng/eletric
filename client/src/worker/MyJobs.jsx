import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { CheckCircle2, MapPin, Play, UploadCloud } from 'lucide-react'
import { statusColors } from '../data/catalog'
import { fullAddress } from '../utils/format'
import UploadWorkPhoto from './UploadWorkPhoto'
import { completeWorkerJob, updateBookingStatus } from '../utils/firebaseUploads'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'

const checklistItems = [
  'Customer area is safe',
  'Power point tested',
  'Work area cleaned',
]

export default function MyJobs({ workerId }) {
  const user = useAuthStore((state) => state.user)
  const activeWorkerId = workerId || user?.uid
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [checklists, setChecklists] = useState({})
  const [completingId, setCompletingId] = useState('')
  const visibleJobs = filter === 'all' ? jobs : jobs.filter((job) => job.status === filter)

  useEffect(() => {
    if (!activeWorkerId || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setJobs([]))
      return undefined
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'bookings'), where('workerUID', '==', activeWorkerId)),
      (snapshot) => {
        const nextJobs = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        setJobs(nextJobs)
      },
      () => Promise.resolve().then(() => setJobs([])),
    )
    return unsubscribe
  }, [activeWorkerId])

  const updateStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status)
      setJobs((items) =>
        items.map((item) => (item.id === bookingId || item.bookingId === bookingId ? { ...item, status, updatedAt: new Date().toISOString() } : item)),
      )
      toast.success('Job status updated.')
    } catch (err) {
      toast.error(err.message || 'Unable to update job status.')
    }
  }

  const toggleChecklist = (jobId, label) => {
    setChecklists((current) => {
      const selected = new Set(current[jobId] || [])
      if (selected.has(label)) selected.delete(label)
      else selected.add(label)
      return { ...current, [jobId]: Array.from(selected) }
    })
  }

  const markComplete = async (job) => {
    const photos = job.completionPhotos || (job.workCompletionPhotoURL ? [job.workCompletionPhotoURL] : [])
    const checked = checklists[job.id] || []
    if (!photos.length || checked.length < checklistItems.length) {
      toast.error('Upload at least one photo and complete every checklist item first.')
      return
    }

    setCompletingId(job.id)
    try {
      const completed = await completeWorkerJob({ booking: job, workerName: job.workerName, photos })
      setJobs((items) => items.map((item) => (item.id === job.id ? { ...item, ...completed } : item)))
      toast.success('Job marked complete.')
    } catch (err) {
      toast.error(err.message || 'Unable to complete job.')
    } finally {
      setCompletingId('')
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold text-gray-950 dark:text-white">My Jobs</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'assigned', 'in-progress', 'completed'].map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                filter === status ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {visibleJobs.length === 0 ? (
          <p className="p-6 text-center text-sm font-semibold text-gray-500">No jobs assigned yet.</p>
        ) : visibleJobs.map((job) => (
          <article key={job.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-950 dark:text-white">{job.serviceName}</h3>
                <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {job.customer} | {job.mobile}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={16} /> {fullAddress(job.address)}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {job.date} | {job.timeSlot}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress(job.address))}`}
                >
                  View on Map
                </a>
                {job.status === 'assigned' && (
                  <button type="button" className="btn-primary" onClick={() => updateStatus(job.id || job.bookingId, 'in-progress')}>
                    <Play size={17} /> Start Job
                  </button>
                )}
                {job.status === 'in-progress' && (
                  <span className="btn-secondary">
                    <UploadCloud size={17} /> Upload photo to complete
                  </span>
                )}
              </div>
              {job.status === 'in-progress' && (
                <div className="mt-5 rounded-lg border border-gray-100 p-4 dark:border-white/10">
                  <p className="text-sm font-bold text-gray-950 dark:text-white">Completion checklist</p>
                  <div className="mt-3 grid gap-2">
                    {checklistItems.map((item) => {
                      const checked = (checklists[job.id] || []).includes(item)
                      return (
                        <label key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-amber-500"
                            checked={checked}
                            onChange={() => toggleChecklist(job.id, item)}
                          />
                          {item}
                        </label>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    disabled={
                      completingId === job.id ||
                      !(job.completionPhotos?.length || job.workCompletionPhotoURL) ||
                      (checklists[job.id] || []).length < checklistItems.length
                    }
                    onClick={() => markComplete(job)}
                  >
                    <CheckCircle2 size={17} /> {completingId === job.id ? 'Completing...' : 'Mark as Complete'}
                  </button>
                </div>
              )}
            </div>
            <UploadWorkPhoto bookingId={job.bookingId || job.id} booking={job} workerId={activeWorkerId} workerName={job.workerName} onUploaded={(url) => {
              setJobs((items) => items.map((item) => (item.id === job.id ? { ...item, workCompletionPhotoURL: url, completionPhotos: [...(item.completionPhotos || []), url] } : item)))
            }} />
          </article>
        ))}
      </div>
    </div>
  )
}
