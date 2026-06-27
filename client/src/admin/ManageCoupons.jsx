import { useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Gift, Pencil, Plus, Save, Shuffle, Trash2 } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'

const randomCode = () => Math.random().toString(36).slice(2, 10).toUpperCase()

export default function ManageCoupons() {
  const { items: coupons, setItems: setCoupons, loading, error } = useFirestoreCollection('coupons', [], 'createdAt')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    code: '',
    type: 'flat',
    value: 100,
    minOrder: 199,
    maxUses: 100,
    expiresAt: '2026-12-31',
  })

  const addCoupon = async (event) => {
    event.preventDefault()
    const id = form.code.trim().toLowerCase()
    const existing = coupons.find((item) => item.id === id)
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      maxUses: Number(form.maxUses),
      usedCount: existing ? (existing.usedCount ?? 0) : 0,
      isActive: existing ? (existing.isActive !== false) : true,
      userId: existing ? (existing.userId || null) : null,
      singleUse: existing ? (existing.singleUse || false) : false,
      updatedAt: db && isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
    }
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(
          doc(db, 'coupons', id),
          {
            ...payload,
            createdAt: existing?.createdAt || serverTimestamp(),
          },
          { merge: true },
        )
      }
      setCoupons((items) => [{ id, ...payload }, ...items.filter((item) => item.id !== id)])
      toast.success(editingId ? 'Coupon updated.' : 'Coupon added.')
      setForm({
        code: '',
        type: 'flat',
        value: 100,
        minOrder: 199,
        maxUses: 100,
        expiresAt: '2026-12-31',
      })
      setEditingId(null)
    } catch (err) {
      toast.error(err.message || 'Unable to save coupon.')
    }
  }

  const editCoupon = (coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'flat',
      value: coupon.value ?? 100,
      minOrder: coupon.minOrder ?? 199,
      maxUses: coupon.maxUses ?? 100,
      expiresAt: coupon.expiresAt || '2026-12-31',
    })
  }

  const removeCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${coupon.code}'? This cannot be undone.`)) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'coupons', coupon.id))
      setCoupons((items) => items.filter((item) => item.id !== coupon.id))
      toast.success('Coupon deleted.')
      if (editingId === coupon.id) {
        setEditingId(null)
        setForm({
          code: '',
          type: 'flat',
          value: 100,
          minOrder: 199,
          maxUses: 100,
          expiresAt: '2026-12-31',
        })
      }
    } catch (err) {
      toast.error(err.message || 'Unable to delete coupon.')
    }
  }

  return (
    <section className="grid gap-5">
      <form onSubmit={addCoupon} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white"><Gift size={18} /> Coupon Management</h2>
          <button type="button" className="btn-secondary" onClick={() => setForm((value) => ({ ...value, code: randomCode() }))}>
            <Shuffle size={17} /> Auto-generate code
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-6">
          <input className="field uppercase" placeholder="Code" value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))} required />
          <select className="field" value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}>
            <option value="flat">Flat Rs.</option>
            <option value="percent">Percent</option>
          </select>
          <input className="field" type="number" placeholder="Value" value={form.value} onChange={(event) => setForm((value) => ({ ...value, value: event.target.value }))} />
          <input className="field" type="number" placeholder="Min order" value={form.minOrder} onChange={(event) => setForm((value) => ({ ...value, minOrder: event.target.value }))} />
          <input className="field" type="number" placeholder="Max uses" value={form.maxUses} onChange={(event) => setForm((value) => ({ ...value, maxUses: event.target.value }))} />
          <input className="field" type="date" value={form.expiresAt} onChange={(event) => setForm((value) => ({ ...value, expiresAt: event.target.value }))} />
        </div>
        <button type="submit" className="btn-primary mt-4">
          {editingId ? <Save size={17} /> : <Plus size={17} />} {editingId ? 'Save Coupon' : 'Add Coupon'}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        {error && <p className="border-b border-red-100 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Uses</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`coupon-skeleton-${index}`}>
                    <td className="px-4 py-3" colSpan={7}>
                      <div className="h-10 skeleton-shimmer rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-black text-gray-950 dark:text-white">{coupon.code}</td>
                  <td>{coupon.type}</td>
                  <td>{coupon.type === 'flat' ? `Rs. ${coupon.value}` : `${coupon.value}%`}</td>
                  <td>{coupon.usedCount}/{coupon.maxUses}</td>
                  <td>{coupon.expiresAt}</td>
                  <td>{coupon.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => editCoupon(coupon)} aria-label="Edit coupon">
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" onClick={() => removeCoupon(coupon)} aria-label="Delete coupon">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>No coupons found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
