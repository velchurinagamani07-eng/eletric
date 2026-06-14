import { AnimatePresence, motion } from 'framer-motion'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  onClose,
  onConfirm,
}) {
  const confirmClass =
    confirmVariant === 'danger'
      ? 'inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 focus-ring sm:flex-none'
      : 'btn-primary flex-1 sm:flex-none'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/55 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-surface-border bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-gray-900"
            initial={{ y: 20, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <h2 id="confirm-dialog-title" className="font-display text-xl font-extrabold text-navy dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-500 dark:text-gray-300">
                {description}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={onClose}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={confirmClass}
                onClick={async () => {
                  await onConfirm?.()
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
