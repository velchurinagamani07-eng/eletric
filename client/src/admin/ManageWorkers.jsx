import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Ban,
  Eye,
  FileImage,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import {
  deleteWorker,
  saveWorkerRecord,
  updateWorker,
  uploadWorkerProfilePhoto,
} from '../utils/firebaseUploads'
import { apiJson, getApiBaseUrl } from '../utils/apiClient'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'
import { useServiceCategories } from '../hooks/useServices'

const defaultWorkerPhoto = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'

const emptyWorkerForm = {
  name: '',
  phone: '+91',
  email: '',
  specializations: [],
  serviceAreas: '',
  photoURL: '',
}

const normalizePhone = (value = '') => {
  const digits = String(value).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  return digits.length === 10 ? `+91${digits}` : value.trim()
}

const isValidIndianPhone = (value = '') => /^\+91\d{10}$/.test(normalizePhone(value))

const workerId = (worker) => worker.uid || worker.id

const fieldValue = (worker, keys, fallback = '') => {
  for (const key of keys) {
    if (worker?.[key] !== undefined && worker?.[key] !== null && worker?.[key] !== '') return worker[key]
  }
  return fallback
}

const formatSpecializations = (worker) => {
  const values = fieldValue(worker, ['specializations'], [])
  if (Array.isArray(values) && values.length) return values.join(', ')
  return fieldValue(worker, ['specialization', 'category'], 'General electrical work')
}

const timestampLabel = (value) => {
  if (!value) return '-'
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN')
}

export default function ManageWorkers() {
  const authReady = useAuthStore((state) => state.authReady)
  const { categories } = useServiceCategories({ includeAll: false })
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalMode, setModalMode] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [form, setForm] = useState(emptyWorkerForm)
  const [profileFile, setProfileFile] = useState(null)
  const [profilePreview, setProfilePreview] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (!db || !isFirebaseConfigured) {
        setWorkers([])
        return
      }
      const q = query(collection(db, 'workers'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setWorkers(snap.docs.map((entry) => ({ id: entry.id, uid: entry.id, ...entry.data() })))
    } catch (err) {
      console.error('Could not load workers:', err)
      setError(err.message || 'Could not load workers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    fetchWorkers()
  }, [authReady, fetchWorkers])

  const filteredWorkers = useMemo(() => {
    const needle = queryText.trim().toLowerCase()
    return workers.filter((worker) => {
      const active = fieldValue(worker, ['isActive', 'active'], true) !== false && fieldValue(worker, ['status'], 'active') !== 'blocked'
      if (statusFilter === 'active' && !active) return false
      if (statusFilter === 'blocked' && active) return false
      if (!needle) return true
      return [worker.name, worker.mobile, worker.phone, worker.email, formatSpecializations(worker)]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    })
  }, [queryText, statusFilter, workers])

  const resetForm = () => {
    setForm(emptyWorkerForm)
    setProfileFile(null)
    setProfilePreview('')
    setSelectedWorker(null)
  }

  const openAddModal = () => {
    resetForm()
    setModalMode('add')
  }

  const openEditModal = (worker) => {
    const specializations = Array.isArray(worker.specializations)
      ? worker.specializations
      : String(worker.specialization || '').split(',').map((item) => item.trim()).filter(Boolean)
    setSelectedWorker(worker)
    setForm({
      name: worker.name || '',
      phone: fieldValue(worker, ['phone', 'mobile'], '+91'),
      email: worker.email || '',
      specializations,
      serviceAreas: Array.isArray(worker.serviceAreas) ? worker.serviceAreas.join(', ') : worker.serviceAreas || '',
      photoURL: worker.photoURL || '',
    })
    setProfileFile(null)
    setProfilePreview(worker.photoURL || '')
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    resetForm()
  }

  const toggleSpecialization = (categoryName) => {
    setForm((current) => {
      const exists = current.specializations.includes(categoryName)
      return {
        ...current,
        specializations: exists
          ? current.specializations.filter((item) => item !== categoryName)
          : [...current.specializations, categoryName],
      }
    })
  }

  const saveWorker = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Worker name is required.')
      return
    }
    if (!isValidIndianPhone(form.phone)) {
      toast.error('Enter phone in +91XXXXXXXXXX format.')
      return
    }

    setSaving(true)
    try {
      const phone = normalizePhone(form.phone)
      const digits = phone.replace(/\D/g, '')
      const email = form.email.trim() || `${digits}@homeelectric.worker`
      const tempPassword = `Worker@${digits.slice(-4)}`
      const serviceAreas = form.serviceAreas.split(',').map((item) => item.trim()).filter(Boolean)
      const specialization = form.specializations.join(', ')

      if (modalMode === 'edit' && selectedWorker) {
        let photoURL = form.photoURL || selectedWorker.photoURL || defaultWorkerPhoto
        if (profileFile) {
          photoURL = await uploadWorkerProfilePhoto({
            workerId: workerId(selectedWorker),
            file: profileFile,
          })
        }
        const payload = {
          name: form.name.trim(),
          phone,
          mobile: phone,
          email,
          specializations: form.specializations,
          specialization,
          serviceAreas,
          photoURL,
          updatedAt: serverTimestamp(),
        }
        await updateWorker(workerId(selectedWorker), payload)
        setWorkers((items) => items.map((item) => (workerId(item) === workerId(selectedWorker) ? { ...item, ...payload } : item)))
        toast.success('Worker updated.')
        closeModal()
        return
      }

      const workerPayload = {
        name: form.name.trim(),
        email,
        password: tempPassword,
        mobile: phone,
        phone,
        specialization,
        specializations: form.specializations,
        serviceAreas,
        photoURL: form.photoURL || defaultWorkerPhoto,
      }

      let createdWorker
      if (getApiBaseUrl()) {
        createdWorker = await apiJson('/api/workers', {
          method: 'POST',
          body: workerPayload,
        })
      } else {
        const id = `worker-${Date.now()}`
        createdWorker = {
          uid: id,
          id,
          ...workerPayload,
          password: undefined,
          isActive: true,
          status: 'active',
          totalJobsCompleted: 0,
          rating: 0,
          createdAt: new Date().toISOString(),
        }
      }

      let photoURL = createdWorker.photoURL || workerPayload.photoURL
      if (profileFile) {
        photoURL = await uploadWorkerProfilePhoto({
          workerId: createdWorker.uid || createdWorker.id,
          file: profileFile,
        })
      }

      const publicWorker = {
        ...createdWorker,
        photoURL,
        phone,
        mobile: phone,
        email,
        specialization,
        specializations: form.specializations,
        serviceAreas,
        isActive: createdWorker.isActive !== false,
        status: createdWorker.status || 'active',
        createdAt: createdWorker.createdAt || new Date().toISOString(),
      }
      delete publicWorker.password

      if (!getApiBaseUrl()) {
        await saveWorkerRecord(publicWorker.uid, {
          ...publicWorker,
          createdAt: serverTimestamp(),
        })
      } else if (photoURL !== createdWorker.photoURL) {
        await updateWorker(publicWorker.uid, { photoURL })
      }

      setWorkers((items) => [publicWorker, ...items.filter((item) => workerId(item) !== workerId(publicWorker))])
      toast.success(`Worker created. Login: ${email} / ${tempPassword}`)
      closeModal()
    } catch (err) {
      console.error('Worker save failed:', err)
      toast.error(err.message || 'Unable to save worker.')
    } finally {
      setSaving(false)
    }
  }

  const toggleWorker = async (worker) => {
    const id = workerId(worker)
    const isActive = fieldValue(worker, ['isActive', 'active'], true) !== false
    const nextActive = !isActive
    try {
      await updateWorker(id, {
        isActive: nextActive,
        status: nextActive ? 'active' : 'blocked',
      })
      setWorkers((items) =>
        items.map((item) => (workerId(item) === id ? { ...item, isActive: nextActive, status: nextActive ? 'active' : 'blocked' } : item)),
      )
      toast.success(nextActive ? 'Worker unblocked.' : 'Worker blocked.')
    } catch (err) {
      toast.error(err.message || 'Unable to update worker.')
    }
  }

  const removeWorker = async (worker) => {
    if (!window.confirm(`Delete '${worker.name}'?`)) return
    try {
      await deleteWorker(workerId(worker))
      setWorkers((items) => items.filter((item) => workerId(item) !== workerId(worker)))
      toast.success('Worker deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete worker.')
    }
  }

  return (
    <section className="grid gap-5">
      <header className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">Workers</p>
          <h2 className="mt-1 text-xl font-extrabold">Manage electricians</h2>
          <p className="mt-1 text-sm text-gray-400">Add workers, control access, and keep worker details ready for job assignment.</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={openAddModal}>
          <Plus size={17} /> Add Worker
        </button>
      </header>

      <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
          <input
            className="field pl-10"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search by name, phone, or specialization"
          />
        </label>
        <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All workers</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button type="button" className="btn-secondary" onClick={fetchWorkers}>
          <RefreshCcw size={16} /> Retry
        </button>
      </div>

      {error && (
        <ErrorState message="Could not load workers. Please try again." details={error} onRetry={fetchWorkers} />
      )}

      {!error && loading && <SkeletonTable />}

      {!error && !loading && filteredWorkers.length === 0 && (
        <EmptyState onCta={openAddModal} />
      )}

      {!error && !loading && filteredWorkers.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm lg:block">
            <table className="min-w-full text-left text-sm text-gray-300">
              <thead className="bg-black/40 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Specializations</th>
                  <th>Status</th>
                  <th>Jobs Done</th>
                  <th>Rating</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredWorkers.map((worker) => (
                  <WorkerRow
                    key={workerId(worker)}
                    worker={worker}
                    onView={() => {
                      setSelectedWorker(worker)
                      setModalMode('view')
                    }}
                    onEdit={() => openEditModal(worker)}
                    onToggle={() => toggleWorker(worker)}
                    onDelete={() => removeWorker(worker)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredWorkers.map((worker) => (
              <WorkerCard
                key={workerId(worker)}
                worker={worker}
                onView={() => {
                  setSelectedWorker(worker)
                  setModalMode('view')
                }}
                onEdit={() => openEditModal(worker)}
                onToggle={() => toggleWorker(worker)}
                onDelete={() => removeWorker(worker)}
              />
            ))}
          </div>
        </>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <WorkerFormModal
          mode={modalMode}
          form={form}
          categories={categories}
          profilePreview={profilePreview}
          saving={saving}
          onClose={closeModal}
          onSubmit={saveWorker}
          onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onToggleSpecialization={toggleSpecialization}
          onFile={(file) => {
            setProfileFile(file)
            setProfilePreview(file ? URL.createObjectURL(file) : form.photoURL)
          }}
        />
      )}

      {modalMode === 'view' && selectedWorker && (
        <WorkerViewModal worker={selectedWorker} onClose={closeModal} onEdit={() => openEditModal(selectedWorker)} />
      )}
    </section>
  )
}

function WorkerRow({ worker, onView, onEdit, onToggle, onDelete }) {
  const active = fieldValue(worker, ['isActive', 'active'], true) !== false && fieldValue(worker, ['status'], 'active') !== 'blocked'
  return (
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-3">
        <img src={worker.photoURL || defaultWorkerPhoto} alt="" className="h-11 w-11 rounded-full object-cover" />
      </td>
      <td>
        <p className="font-bold text-white">{worker.name || 'Unnamed worker'}</p>
        <p className="text-xs text-gray-500">{worker.email || 'No email'}</p>
      </td>
      <td>{fieldValue(worker, ['phone', 'mobile'], '-')}</td>
      <td className="max-w-xs">
        <span className="line-clamp-2">{formatSpecializations(worker)}</span>
      </td>
      <td>
        <span className={`badge ${active ? 'bg-green-600/15 text-green-400' : 'bg-red-600/15 text-red-400'}`}>
          {active ? 'Active' : 'Blocked'}
        </span>
      </td>
      <td>{fieldValue(worker, ['jobsDone', 'totalJobsCompleted'], 0)}</td>
      <td>{Number(fieldValue(worker, ['rating'], 0)).toFixed(1)}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <IconButton label="View worker" onClick={onView}><Eye size={16} /></IconButton>
          <IconButton label="Edit worker" onClick={onEdit}><Pencil size={16} /></IconButton>
          <IconButton label={active ? 'Block worker' : 'Unblock worker'} onClick={onToggle}>
            {active ? <Ban size={16} /> : <UserCheck size={16} />}
          </IconButton>
          <IconButton label="Delete worker" danger onClick={onDelete}><Trash2 size={16} /></IconButton>
        </div>
      </td>
    </tr>
  )
}

function WorkerCard({ worker, onView, onEdit, onToggle, onDelete }) {
  const active = fieldValue(worker, ['isActive', 'active'], true) !== false && fieldValue(worker, ['status'], 'active') !== 'blocked'
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-gray-300">
      <div className="flex items-start gap-3">
        <img src={worker.photoURL || defaultWorkerPhoto} alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-white">{worker.name || 'Unnamed worker'}</h3>
          <p className="mt-1 text-gray-400">{fieldValue(worker, ['phone', 'mobile'], '-')}</p>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-green-600/15 text-green-400' : 'bg-red-600/15 text-red-400'}`}>
            {active ? 'Active' : 'Blocked'}
          </span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <InfoPair label="Specializations" value={formatSpecializations(worker)} wide />
        <InfoPair label="Jobs Done" value={fieldValue(worker, ['jobsDone', 'totalJobsCompleted'], 0)} />
        <InfoPair label="Rating" value={Number(fieldValue(worker, ['rating'], 0)).toFixed(1)} />
      </dl>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <IconButton label="View worker" onClick={onView}><Eye size={16} /></IconButton>
        <IconButton label="Edit worker" onClick={onEdit}><Pencil size={16} /></IconButton>
        <IconButton label={active ? 'Block worker' : 'Unblock worker'} onClick={onToggle}>
          {active ? <Ban size={16} /> : <UserCheck size={16} />}
        </IconButton>
        <IconButton label="Delete worker" danger onClick={onDelete}><Trash2 size={16} /></IconButton>
      </div>
    </article>
  )
}

function WorkerFormModal({
  mode,
  form,
  categories,
  profilePreview,
  saving,
  onClose,
  onSubmit,
  onChange,
  onToggleSpecialization,
  onFile,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl sm:max-w-3xl sm:rounded-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">{mode === 'edit' ? 'Edit' : 'Add'} Worker</p>
            <h2 className="mt-1 text-xl font-extrabold">{mode === 'edit' ? 'Update worker profile' : 'Create worker account'}</h2>
          </div>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-800" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold text-gray-300">Name</span>
            <input className="field" value={form.name} onChange={(event) => onChange('name', event.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-gray-300">Phone</span>
            <input className="field" value={form.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="+91XXXXXXXXXX" required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-gray-300">Email</span>
            <input className="field" type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="Optional" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-gray-300">Service areas / pincodes</span>
            <input className="field" value={form.serviceAreas} onChange={(event) => onChange('serviceAreas', event.target.value)} placeholder="533401, Tuni, Payakaraopeta" />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-semibold text-gray-300">Specializations</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(categories.length ? categories : [{ id: 'general', name: 'General electrical work' }]).map((category) => (
              <label key={category.id || category.name} className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm font-semibold text-gray-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-red-600"
                  checked={form.specializations.includes(category.name)}
                  onChange={() => onToggleSpecialization(category.name)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-4 text-center">
          {profilePreview ? (
            <img src={profilePreview} alt="Worker preview" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <FileImage className="text-red-500" size={26} />
          )}
          <span className="text-sm font-semibold text-gray-300">Profile photo upload</span>
          <span className="text-xs text-gray-500">Firebase Storage upload when configured</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => onFile(event.target.files?.[0] || null)} />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            {mode === 'edit' ? 'Save Worker' : 'Create Worker'}
          </button>
        </div>
      </form>
    </div>
  )
}

function WorkerViewModal({ worker, onClose, onEdit }) {
  const active = fieldValue(worker, ['isActive', 'active'], true) !== false && fieldValue(worker, ['status'], 'active') !== 'blocked'
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl sm:max-w-lg sm:rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={worker.photoURL || defaultWorkerPhoto} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-extrabold">{worker.name || 'Unnamed worker'}</h2>
              <p className="text-sm text-gray-400">{worker.email || 'No email'}</p>
            </div>
          </div>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-800" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoPair label="Phone" value={fieldValue(worker, ['phone', 'mobile'], '-')} />
          <InfoPair label="Status" value={active ? 'Active' : 'Blocked'} />
          <InfoPair label="Specializations" value={formatSpecializations(worker)} wide />
          <InfoPair label="Service Areas" value={Array.isArray(worker.serviceAreas) ? worker.serviceAreas.join(', ') : worker.serviceAreas || '-'} wide />
          <InfoPair label="Jobs Done" value={fieldValue(worker, ['jobsDone', 'totalJobsCompleted'], 0)} />
          <InfoPair label="Rating" value={Number(fieldValue(worker, ['rating'], 0)).toFixed(1)} />
          <InfoPair label="Joined" value={timestampLabel(worker.joinedAt || worker.createdAt)} />
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn-primary" onClick={onEdit}><Pencil size={17} /> Edit</button>
        </div>
      </div>
    </div>
  )
}

function IconButton({ label, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-zinc-800 transition ${
        danger ? 'text-red-500 hover:bg-red-600/10' : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
      }`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function InfoPair({ label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-full' : ''}>
      <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-200">{value}</dd>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`worker-skeleton-${index}`} className="mb-3 h-14 animate-pulse rounded-lg bg-zinc-800 last:mb-0" />
      ))}
    </div>
  )
}

function EmptyState({ onCta }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-8 text-center text-white">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-600/10 text-2xl" aria-hidden="true">
        {'\u{1F477}'}
      </div>
      <h3 className="mt-4 text-lg font-extrabold">No workers added yet</h3>
      <p className="mt-2 text-sm text-gray-400">Add your first worker to start assigning jobs.</p>
      <button type="button" className="btn-primary mt-5" onClick={onCta}>
        <Plus size={17} /> Add Worker
      </button>
    </div>
  )
}

function ErrorState({ message, details, onRetry }) {
  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-5 text-white">
      <h3 className="font-extrabold">{message}</h3>
      {details && <p className="mt-2 text-sm text-red-200">{details}</p>}
      <button type="button" className="btn-primary mt-4" onClick={onRetry}>
        <RefreshCcw size={16} /> Try Again
      </button>
    </div>
  )
}
