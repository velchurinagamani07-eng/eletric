import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { BriefcaseBusiness, CheckCircle2, Clock3, Timer } from 'lucide-react'
import MyJobs from '../worker/MyJobs'
import { todayISO } from '../utils/format'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'

export default function WorkerDashboard() {
  const user = useAuthStore((state) => state.user)
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    if (!user?.uid || !db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setJobs([]))
      return undefined
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'bookings'), where('workerUID', '==', user.uid)),
      (snapshot) => setJobs(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))),
      () => Promise.resolve().then(() => setJobs([])),
    )
    return unsubscribe
  }, [user?.uid])

  const today = todayISO()
  const todaysJobs = jobs.filter((booking) => booking.date === today)
  const completed = jobs.filter((booking) => booking.status === 'completed')

  return (
    <>
      <Helmet>
        <title>Worker Dashboard | DP Home Electric Services</title>
      </Helmet>
      <section className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Today Jobs', todaysJobs.length, BriefcaseBusiness, 'text-blue-600'],
            ['Pending', jobs.filter((job) => ['assigned', 'on_the_way'].includes(job.status)).length, Timer, 'text-amber-600'],
            ['Completed', completed.length, CheckCircle2, 'text-emerald-600'],
            ['Upcoming', jobs.filter((job) => ['confirmed', 'assigned'].includes(job.status)).length, Clock3, 'text-gray-950 dark:text-white'],
          ].map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <Icon className={color} size={22} />
              <p className="mt-3 text-sm font-semibold text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        <MyJobs workerId={user?.uid} />
      </section>
    </>
  )
}
