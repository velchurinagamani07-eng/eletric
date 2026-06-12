import toast from 'react-hot-toast'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { CheckCircle2, Star, Trash2, XCircle } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'

export default function ManageReviews() {
  const { items: reviews, setItems, loading, error } = useFirestoreCollection('reviews', [], 'createdAt')

  const setReviewState = async (review, isApproved) => {
    try {
      if (db && isFirebaseConfigured) {
        await updateDoc(doc(db, 'reviews', review.id), { isApproved, isActive: isApproved, updatedAt: serverTimestamp() })
      }
      setItems((items) => items.map((item) => (item.id === review.id ? { ...item, isApproved, isActive: isApproved } : item)))
      toast.success(isApproved ? 'Review approved.' : 'Review hidden.')
    } catch (err) {
      toast.error(err.message || 'Unable to update review.')
    }
  }

  const removeReview = async (review) => {
    if (!window.confirm('Delete this review?')) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'reviews', review.id))
      setItems((items) => items.filter((item) => item.id !== review.id))
      toast.success('Review deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete review.')
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div>
        <h2 className="font-bold text-navy-900 dark:text-white">Reviews</h2>
        <p className="mt-1 text-sm text-gray-500">Approve, hide, or delete customer feedback.</p>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-5 grid gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={`review-skeleton-${index}`} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />)
        ) : reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-500 dark:border-white/10">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-950 dark:text-white">{review.customerName || review.name || 'Customer'}</p>
                    <span className={`badge ${review.isApproved || review.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                      {review.isApproved || review.isActive ? 'Published' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1 text-amber-500">
                    {Array.from({ length: Number(review.rating || 5) }).map((_, index) => (
                      <Star key={`${review.id}-star-${index}`} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{review.text || review.comment || review.message || '-'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50" onClick={() => setReviewState(review, true)} aria-label="Approve review">
                    <CheckCircle2 size={17} />
                  </button>
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-amber-700 hover:bg-amber-50" onClick={() => setReviewState(review, false)} aria-label="Hide review">
                    <XCircle size={17} />
                  </button>
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50" onClick={() => removeReview(review)} aria-label="Delete review">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
