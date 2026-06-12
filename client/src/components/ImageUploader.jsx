import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, GripVertical, ImageUp, RotateCcw, Trash2 } from 'lucide-react'
import { compressAndUploadToImgBB } from '../utils/compressToWebP'

const makeId = (file) => `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`

export default function ImageUploader({
  label,
  currentImageUrl = '',
  onUploadComplete,
  aspectRatio = '16 / 9',
  maxSizeMB = 5,
  multiple = false,
  folder = 'uploads',
  maxFiles = Infinity,
}) {
  const shouldEmitUrlsRef = useRef(false)
  const initialItems = useMemo(
    () =>
      multiple
        ? (Array.isArray(currentImageUrl) ? currentImageUrl : currentImageUrl ? [currentImageUrl] : []).map((url, index) => ({
            id: `${url}-${index}`,
            url,
            preview: url,
            progress: 100,
            status: 'complete',
            error: '',
            sizeKB: 0,
          }))
        : [],
    [currentImageUrl, multiple],
  )
  const [items, setItems] = useState(initialItems)
  const [single, setSingle] = useState({
    preview: currentImageUrl || '',
    url: currentImageUrl || '',
    progress: currentImageUrl ? 100 : 0,
    status: currentImageUrl ? 'complete' : 'idle',
    error: '',
    file: null,
    sizeKB: 0,
  })

  useEffect(() => {
    if (multiple) {
      setItems((current) => {
        const hasLocalActivity = current.some((item) => item.file || item.status === 'uploading' || item.status === 'error')
        const currentUrls = current.filter((item) => item.status === 'complete').map((item) => item.url).join('|')
        const nextUrls = initialItems.map((item) => item.url).join('|')
        if (hasLocalActivity || currentUrls === nextUrls) return current
        return initialItems
      })
    } else {
      setSingle((current) => ({
        ...current,
        preview: currentImageUrl || '',
        url: currentImageUrl || '',
        progress: currentImageUrl ? 100 : 0,
        status: currentImageUrl ? 'complete' : 'idle',
      }))
    }
  }, [currentImageUrl, initialItems, multiple])

  const validate = (file) => {
    if (!file?.type?.startsWith('image/')) return 'Only image files can be uploaded.'
    if (file.size > maxSizeMB * 1024 * 1024) return `Image must be ${maxSizeMB}MB or smaller.`
    return ''
  }

  const uploadSingle = async (file) => {
    const error = validate(file)
    if (error) {
      setSingle((current) => ({ ...current, error, status: 'error' }))
      return
    }

    const preview = URL.createObjectURL(file)
    setSingle({ preview, url: '', progress: 0, status: 'uploading', error: '', file })
    try {
      const result = await compressAndUploadToImgBB(file, {
        name: `${folder}-${Date.now()}`,
        onProgress: (progress) => setSingle((current) => ({ ...current, progress })),
      })
      const url = result.url
      setSingle({ preview: url, url, progress: 100, status: 'complete', error: '', file: null, sizeKB: result.sizeKB })
      await onUploadComplete?.(url)
    } catch (err) {
      setSingle((current) => ({ ...current, status: 'error', error: err.message || 'Upload failed.', file }))
    }
  }

  const uploadMultiple = (files) => {
    const remaining = Math.max(0, Number(maxFiles) - items.length)
    const nextFiles = Array.from(files || []).slice(0, remaining)
    if (!nextFiles.length) return

    nextFiles.forEach((file) => {
      const id = makeId(file)
      const error = validate(file)
      const preview = file ? URL.createObjectURL(file) : ''

      setItems((current) => [
        ...current,
        { id, file, preview, url: '', progress: 0, status: error ? 'error' : 'uploading', error },
      ])

      if (error) return

      compressAndUploadToImgBB(file, {
        name: `${folder}-${Date.now()}-${safeName(file.name)}`,
        onProgress: (progress) =>
          setItems((current) => current.map((item) => (item.id === id ? { ...item, progress } : item))),
      })
        .then((result) => {
          const url = result.url
          shouldEmitUrlsRef.current = true
          setItems((current) => {
            return current.map((item) =>
              item.id === id ? { ...item, preview: url, url, progress: 100, status: 'complete', error: '', file: null, sizeKB: result.sizeKB } : item,
            )
          })
        })
        .catch((err) => {
          setItems((current) =>
            current.map((item) =>
              item.id === id ? { ...item, status: 'error', error: err.message || 'Upload failed.', file } : item,
            ),
          )
        })
    })
  }

  const removeItem = (id) => {
    shouldEmitUrlsRef.current = true
    setItems((current) => {
      return current.filter((item) => item.id !== id)
    })
  }

  const reorderItem = (id, direction) => {
    shouldEmitUrlsRef.current = true
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const updated = [...current]
      const [item] = updated.splice(index, 1)
      updated.splice(nextIndex, 0, item)
      return updated
    })
  }

  useEffect(() => {
    if (!multiple || !shouldEmitUrlsRef.current) return
    shouldEmitUrlsRef.current = false
    onUploadComplete?.(items.filter((item) => item.status === 'complete').map((item) => item.url))
  }, [items, multiple, onUploadComplete])

  return (
    <div>
      <label
        className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-white p-4 text-center shadow-sm transition hover:border-orange-400 hover:bg-[#FFF8F3] dark:border-white/10 dark:bg-white/5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          if (multiple) uploadMultiple(event.dataTransfer.files)
          else uploadSingle(event.dataTransfer.files?.[0])
        }}
        style={!multiple && single.preview ? { aspectRatio } : undefined}
      >
        {!multiple && single.preview ? (
          <SinglePreview item={single} aspectRatio={aspectRatio} />
        ) : (
          <>
            <ImageUp className="text-orange-500" size={28} />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
            <span className="text-xs font-semibold text-gray-400">ImgBB upload, max {maxSizeMB}MB</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            if (multiple) uploadMultiple(event.target.files)
            else uploadSingle(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>

      {!multiple && single.status === 'error' && (
        <ErrorLine
          error={single.error}
          onRetry={single.file ? () => uploadSingle(single.file) : undefined}
        />
      )}
      {!multiple && single.status === 'complete' && single.sizeKB > 0 && (
        <p className="mt-2 text-xs font-bold text-emerald-600">Compressed to {single.sizeKB}KB WebP</p>
      )}

      {multiple && items.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => (
            <div key={item.id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-950">
              <img src={item.preview || item.url} alt="" className="h-28 w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  Cover
                </span>
              )}
              <div className="absolute right-2 top-2 flex gap-1">
                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600 shadow" onClick={() => reorderItem(item.id, -1)} aria-label="Move image earlier">
                  <GripVertical size={14} />
                </button>
                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow" onClick={() => removeItem(item.id)} aria-label="Remove image">
                  <Trash2 size={14} />
                </button>
              </div>
              {item.status === 'uploading' && <CircularProgress progress={item.progress} />}
              {item.status === 'complete' && <CheckCircle2 className="absolute bottom-2 right-2 rounded-full bg-white text-emerald-500" size={22} />}
              {item.status === 'complete' && item.sizeKB > 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-emerald-600 shadow">
                  {item.sizeKB}KB WebP
                </span>
              )}
              {item.status === 'error' && <ErrorLine error={item.error} onRetry={item.file ? () => uploadMultiple([item.file]) : undefined} compact />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SinglePreview({ item, aspectRatio }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio }}>
      <img src={item.preview} alt="" className="h-full w-full object-cover" />
      {item.status === 'uploading' && <CircularProgress progress={item.progress} />}
      {item.status === 'complete' && (
        <>
          <CheckCircle2 className="absolute right-3 top-3 rounded-full bg-white text-emerald-500" size={26} />
          <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-gray-800 shadow">
            Change
          </span>
        </>
      )}
    </div>
  )
}

function CircularProgress({ progress }) {
  const value = Math.max(0, Math.min(100, Number(progress || 0)))

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/45">
      <div
        className="grid h-16 w-16 place-items-center rounded-full text-sm font-black text-white"
        style={{ background: `conic-gradient(#F59E0B ${value * 3.6}deg, rgba(255,255,255,0.25) 0deg)` }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-950/85">{value}%</span>
      </div>
    </div>
  )
}

function ErrorLine({ error, onRetry, compact = false }) {
  return (
    <div className={`${compact ? 'absolute inset-x-2 bottom-2' : 'mt-2'} rounded-lg bg-red-50 p-2 text-left`}>
      <p className="text-xs font-bold text-red-600">{error}</p>
      {onRetry && (
        <button type="button" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-red-700" onClick={onRetry}>
          <RotateCcw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

function safeName(name = 'image') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
