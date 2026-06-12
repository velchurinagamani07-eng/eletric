import { Link } from 'react-router-dom'
import { Bolt, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <section className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-amber-500 text-gray-950">
          <Bolt fill="currentColor" size={26} />
        </span>
        <h1 className="mt-5 text-4xl font-extrabold text-gray-950 dark:text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-gray-500">
          This route is not wired into the Home Electric Services app.
        </p>
        <Link to="/" className="btn-primary mt-6">
          <Home size={17} /> Go Home
        </Link>
      </section>
    </main>
  )
}

