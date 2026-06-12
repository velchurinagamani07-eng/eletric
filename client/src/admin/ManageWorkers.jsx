import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, FileImage, Loader2, Plus, Power, Trash2 } from 'lucide-react'
import { workers as workerSeed } from '../data/catalog'
import {
  deleteWorker,
  saveWorkerRecord,
  updateWorker,
  uploadWorkerProfilePhoto,
  uploadWorkerAadharDocument,
} from '../utils/firebaseUploads'
import { apiJson, getApiBaseUrl } from '../utils/apiClient'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import UploadStatus from '../components/UploadStatus'

const emptyForm = { name: '', email: '', mobile: '', specialization: '', password: '', photoURL: '' }
const defaultWorkerPhoto = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'

export default function ManageWorkers() {
  const { items: workers, setItems: setWorkers, loading, error } = useFirestoreCollection('workers', workerSeed)
  const [form, setForm] = useState(emptyForm)
  const [profileFile, setProfileFile] = useState(null)
  const [profilePreview, setProfilePreview] = useState('')
  const [profileFileName, setProfileFileName] = useState('')
  const [aadharFile, setAadharFile] = useState(null)
  const [aadharPreview, setAadharPreview] = useState('')
  const [aadharFileName, setAadharFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')

  const reset = () => {
    setForm(emptyForm)
    setProfileFile(null)
    setProfilePreview('')
    setProfileFileName('')
    setAadharFile(null)
    setAadharPreview('')
    setAadharFileName('')
    setUploadProgress(0)
    setUploadError('')
  }

  const addWorker = async (event) => {
    event?.preventDefault?.()
    setSaving(true)
    setUploadProgress(0)
    setUploadError('')
    try {
      const workerPayload = {
        ...form,
        photoURL: form.photoURL || defaultWorkerPhoto,
      }
      const publicWorkerFields = { ...workerPayload }
      delete publicWorkerFields.password
      let worker = {
        uid: `worker-${Date.now()}`,
        ...publicWorkerFields,
        isActive: true,
        totalJobsCompleted: 0,
        earnings: 0,
        rating: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
      }

      const apiConfigured = Boolean(getApiBaseUrl())
      if (apiConfigured) {
        const data = await apiJson('/api/workers', {
          method: 'POST',
          body: workerPayload,
        })
        worker = {
          ...worker,
          ...data,
          photoURL: data.photoURL || worker.photoURL,
        }
      }

      if (profileFile) {
        worker.photoURL = await uploadWorkerProfilePhoto({
          workerId: worker.uid,
          file: profileFile,
          onProgress: setUploadProgress,
        })
      }

      if (aadharFile) {
        const aadharUpload = await uploadWorkerAadharDocument({
          workerId: worker.uid,
          file: aadharFile,
          onProgress: setUploadProgress,
        })
        worker.aadharPath = aadharUpload.path
        if (aadharUpload.url) worker.aadharURL = aadharUpload.url
      }

      if (apiConfigured && !worker.demo) {
        const uploadedFields = {
          ...(worker.photoURL ? { photoURL: worker.photoURL } : {}),
          ...(worker.aadharURL ? { aadharURL: worker.aadharURL } : {}),
          ...(worker.aadharPath ? { aadharPath: worker.aadharPath } : {}),
        }
        if (Object.keys(uploadedFields).length) await updateWorker(worker.uid, uploadedFields)
      } else {
        await saveWorkerRecord(worker.uid, worker)
      }

      setWorkers((items) => [worker, ...items.filter((item) => (item.uid || item.id) !== worker.uid)])
      reset()
      toast.success('Worker created successfully.')
    } catch (error) {
      const message = error.message || 'Worker creation failed.'
      setUploadError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleWorker = async (worker) => {
    const isActive = !worker.isActive
    try {
      await updateWorker(worker.uid, { isActive })
      setWorkers((items) => items.map((item) => (item.uid === worker.uid ? { ...item, isActive } : item)))
      toast.success(isActive ? 'Worker activated.' : 'Worker deactivated.')
    } catch (err) {
      toast.error(err.message || 'Unable to update worker.')
    }
  }

  const removeWorker = async (worker) => {
    if (!window.confirm(`Delete '${worker.name}'?`)) return
    try {
      await deleteWorker(worker.uid)
      setWorkers((items) => items.filter((item) => item.uid !== worker.uid))
      toast.success('Worker deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete worker.')
    }
  }

  return (
    <section className="grid gap-5">
      <form onSubmit={addWorker} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h2 className="font-bold text-gray-950 dark:text-white">Add Worker</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {[
            ['name', 'Name'],
            ['email', 'Email'],
            ['mobile', 'Mobile'],
            ['specialization', 'Specialization'],
            ['password', 'Password'],
          ].map(([field, placeholder]) => (
            <input
              key={field}
              className="field"
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              placeholder={placeholder}
              value={form[field]}
              onChange={(event) => setForm((value) => ({ ...value, [field]: event.target.value }))}
              required
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <PrivateDocumentInput
            label="Profile photo"
            accept="image/*"
            preview={profilePreview}
            fileName={profileFileName}
            helperText="Private Firebase Storage profile image"
            onChange={(file) => {
              setProfileFile(file)
              setProfilePreview(file?.type?.startsWith('image/') ? URL.createObjectURL(file) : '')
              setProfileFileName(file?.name || '')
            }}
          />
          <PrivateDocumentInput
            label="Aadhar document"
            accept="image/*,application/pdf"
            preview={aadharPreview}
            fileName={aadharFileName}
            helperText="Private Firebase Storage document"
            onChange={(file) => {
              setAadharFile(file)
              setAadharPreview(file?.type?.startsWith('image/') ? URL.createObjectURL(file) : '')
              setAadharFileName(file?.name || '')
            }}
          />
        </div>
        <UploadStatus
          compression={0}
          upload={uploadProgress}
          error={uploadError}
          onRetry={addWorker}
        />
        <button type="submit" className="btn-primary mt-4" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Create Worker
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        {error && <p className="border-b border-red-100 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Worker</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Specialization</th>
                <th>Jobs</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`worker-skeleton-${index}`}>
                    <td className="px-4 py-3" colSpan={7}>
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : workers.map((worker) => (
                <tr key={worker.uid}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={worker.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <span className="font-semibold text-gray-950 dark:text-white">{worker.name}</span>
                    </div>
                  </td>
                  <td>{worker.email}</td>
                  <td>{worker.mobile}</td>
                  <td>{worker.specialization}</td>
                  <td>{worker.totalJobsCompleted}</td>
                  <td>{worker.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Toggle worker" onClick={() => toggleWorker(worker)}><Power size={16} /></button>
                      <a
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label="Notify worker"
                        href={`https://wa.me/91${worker.mobile}?text=${encodeURIComponent('Hello, please check your Home Electric Services job panel.')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Bell size={16} />
                      </a>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete worker" onClick={() => removeWorker(worker)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function PrivateDocumentInput({ label, preview, fileName, accept, helperText, onChange }) {
  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
      {preview ? (
        <img src={preview} alt={`${label} preview`} className="max-h-32 rounded-lg object-cover" />
      ) : (
        <FileImage className="text-amber-600" size={24} />
      )}
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</span>
      {fileName && <span className="max-w-full truncate text-xs font-semibold text-gray-400">{fileName}</span>}
      <span className="text-xs font-semibold text-gray-400">{helperText}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  )
}
