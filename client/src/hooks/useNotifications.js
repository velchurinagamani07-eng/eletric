import { useEffect, useRef, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const allowedRoles = new Set(['admin', 'superadmin', 'worker'])

export function useNotifications(user) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const previousCount = useRef(0)

  useEffect(() => {
    if (!user?.uid || !allowedRoles.has(user.role) || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setItems([])
        setLoading(false)
        previousCount.current = 0
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const isAdmin = ['admin', 'superadmin'].includes(user.role)
    const ref = isAdmin
      ? query(
          collection(db, 'notifications'),
          where('role', 'in', ['admin', 'superadmin']),
          orderBy('createdAt', 'desc'),
          limit(50),
        )
      : query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50),
        )

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      const unreadCount = next.filter((item) => !item.isRead).length
      if (unreadCount > previousCount.current) {
        const newestUnread = next.find((item) => !item.isRead)
        new Audio('/notification.mp3').play().catch(() => {})
        if (
          ['admin', 'superadmin'].includes(user.role) &&
          document.hidden &&
          newestUnread &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification(newestUnread.title || 'New admin notification', {
            body: newestUnread.body || 'Open the admin panel for details.',
            tag: newestUnread.id,
          })
        }
      }
      previousCount.current = unreadCount
      setItems(next)
      setLoading(false)
    }, () => {
      setItems([])
      setLoading(false)
    })

    return unsubscribe
  }, [user?.uid, user?.role])

  const markRead = async (notificationId) => {
    setItems((current) => current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)))
    if (db && isFirebaseConfigured) {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true, readAt: serverTimestamp() })
    }
  }

  const markAllRead = async () => {
    const unread = items.filter((item) => !item.isRead)
    setItems((current) => current.map((item) => ({ ...item, isRead: true })))
    if (db && isFirebaseConfigured && unread.length) {
      const batch = writeBatch(db)
      unread.forEach((item) => {
        batch.update(doc(db, 'notifications', item.id), { isRead: true, readAt: serverTimestamp() })
      })
      await batch.commit()
    }
  }

  const deleteRead = async () => {
    const read = items.filter((item) => item.isRead)
    setItems((current) => current.filter((item) => !item.isRead))
    if (db && isFirebaseConfigured) {
      await Promise.all(read.map((item) => deleteDoc(doc(db, 'notifications', item.id))))
    }
  }

  return {
    notifications: items,
    unreadCount: items.filter((item) => !item.isRead).length,
    loading,
    markRead,
    markAllRead,
    deleteRead,
  }
}
