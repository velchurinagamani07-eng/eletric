import toast from 'react-hot-toast'
import ImageUploader from '../components/ImageUploader'
import { recordWorkCompletionPhoto } from '../utils/firebaseUploads'

export default function UploadWorkPhoto({ bookingId, booking, workerId, workerName, onUploaded }) {
  const resolvedBooking = booking || { id: bookingId, bookingId }
  const resolvedBookingId = resolvedBooking.bookingId || resolvedBooking.id || bookingId

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-white/10">
      <ImageUploader
        label="Capture or browse completion photo"
        currentImageUrl={resolvedBooking.workCompletionPhotoURL || ''}
        folder={`worker-${workerId || resolvedBooking.workerUID || 'worker'}-completion-${resolvedBookingId || 'job'}`}
        onUploadComplete={async (photoURL) => {
          await recordWorkCompletionPhoto({
            photoURL,
            booking: resolvedBooking,
            workerId,
            workerName,
          })
          onUploaded?.(photoURL)
          toast.success(`Photo uploaded for ${resolvedBookingId}`)
        }}
      />
      <p className="mt-2 text-xs font-semibold text-gray-500">
        Completion images upload to ImgBB and the returned URL is saved to the booking record.
      </p>
    </div>
  )
}
