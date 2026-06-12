import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Copy, ExternalLink, ShieldCheck, ShieldMinus, ShieldPlus } from 'lucide-react'
import { users as userSeed } from '../data/catalog'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'

const consoleUserUrl = (uid) =>
  `https://console.firebase.google.com/project/homeelectricservice-9d66c/authentication/users/${uid}`

export default function ManageRoles() {
  const { items, setItems, loading, error } = useFirestoreCollection('users', userSeed)
  const admins = items.filter((user) => user.role === 'admin' || user.role === 'superadmin')

  const copyUid = async (uid) => {
    await navigator.clipboard?.writeText(uid)
    toast.success('Firebase UID copied.')
  }

  const setRole = async (user, role) => {
    try {
      if (db && isFirebaseConfigured) {
        await updateDoc(doc(db, 'users', user.uid), {
          role,
          updatedAt: serverTimestamp(),
        })
      }
      setItems((current) => current.map((item) => (item.uid === user.uid ? { ...item, role } : item)))
      toast.success(`${user.name} is now ${role}.`)
    } catch (err) {
      toast.error(err.message || 'Unable to update role.')
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-white/10">
        <h2 className="font-bold text-gray-950 dark:text-white">Admin Roles</h2>
        <p className="mt-1 text-sm text-gray-500">Shows only admin and superadmin accounts.</p>
        {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th>Role</th>
              <th>Status</th>
              <th>Tools</th>
              <th>Role Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={`role-skeleton-${index}`}>
                  <td className="px-4 py-3" colSpan={5}>
                    <div className="h-10 skeleton-shimmer rounded-lg" />
                  </td>
                </tr>
              ))
            ) : admins.map((user) => (
              <tr key={user.uid}>
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-950 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td>
                  <span className="badge bg-amber-100 text-amber-800">
                    <ShieldCheck size={13} className="mr-1" /> {user.role}
                  </span>
                </td>
                <td>{user.isActive !== false ? 'Active' : 'Inactive'}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => copyUid(user.uid)}>
                      <Copy size={14} /> Copy UID
                    </button>
                    <a className="btn-secondary min-h-9 px-3 py-1.5 text-xs" href={consoleUserUrl(user.uid)} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} /> Firebase
                    </a>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'superadmin' && (
                      <button type="button" className="btn-primary min-h-9 px-3 py-1.5 text-xs" onClick={() => setRole(user, 'superadmin')}>
                        <ShieldPlus size={14} /> Promote
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button type="button" className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => setRole(user, 'admin')}>
                        <ShieldMinus size={14} /> Demote
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
