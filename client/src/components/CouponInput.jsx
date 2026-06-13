import { useState } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { Loader2, Tag } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'

const asDate = (value) => value?.toDate?.() || (value ? new Date(value) : null)

export default function CouponInput({ amount, onApply }) {
  const user = useAuthStore((state) => state.user)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const applyCoupon = async () => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) {
      setMessage('Enter a coupon code.')
      return
    }

    if (!db || !isFirebaseConfigured) {
      setMessage('Coupon validation is unavailable.')
      onApply?.(null, 0)
      return
    }

    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', normalized), limit(1)))
      const entry = snap.docs[0]
      const coupon = entry ? { id: entry.id, ...entry.data() } : null

      if (!coupon || coupon.isActive === false) {
        setMessage('Coupon is invalid or inactive.')
        onApply?.(null, 0)
        return
      }

      const expiresAt = asDate(coupon.expiresAt)
      if (expiresAt && expiresAt < new Date()) {
        setMessage('Coupon has expired.')
        onApply?.(null, 0)
        return
      }

      if (coupon.userId && coupon.userId !== user?.uid) {
        setMessage('This coupon is not available for this account.')
        onApply?.(null, 0)
        return
      }

      if (Number(coupon.maxUses || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.maxUses)) {
        setMessage('Coupon usage limit has been reached.')
        onApply?.(null, 0)
        return
      }

      if (Number(amount) < Number(coupon.minOrder || 0)) {
        setMessage(`Minimum order value is Rs. ${Number(coupon.minOrder || 0).toLocaleString('en-IN')}.`)
        onApply?.(null, 0)
        return
      }

      const discount =
        coupon.type === 'percent'
          ? Math.min(Math.round((Number(amount) * Number(coupon.value || 0)) / 100), Number(amount))
          : Math.min(Number(coupon.value || 0), Number(amount))
      setMessage(`${coupon.code} applied. You saved Rs. ${discount.toLocaleString('en-IN')}.`)
      onApply?.(coupon, discount)
    } catch (error) {
      setMessage(error.message || 'Unable to validate coupon.')
      onApply?.(null, 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">Coupon code</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            className="field pl-10 uppercase"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="POWER10"
          />
        </div>
        <button type="button" className="btn-secondary" onClick={applyCoupon} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-gray-500">{message}</p>}
    </div>
  )
}
