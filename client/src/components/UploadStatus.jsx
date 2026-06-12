import { CheckCircle2, RotateCcw } from 'lucide-react'

export default function UploadStatus({
  compression = 0,
  upload = 0,
  error = '',
  complete = false,
  onRetry,
}) {
  if (!compression && !upload && !error && !complete) return null

  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
      {complete && !error ? (
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={17} /> Upload complete
        </p>
      ) : (
        <div className="grid gap-2">
          <ProgressBar label="Compressing" value={compression} />
          <ProgressBar label="Uploading" value={upload} />
        </div>
      )}

      {error && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          {onRetry && (
            <button type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={onRetry}>
              <RotateCcw size={14} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ProgressBar({ label, value }) {
  const width = Math.max(0, Math.min(100, Number(value || 0)))

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-500">
        <span>{label}</span>
        <span>{width}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white shadow-inner dark:bg-gray-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-200"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
