import { useEffect, useMemo, useRef, useState } from 'react'

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function useReloadCountdown(refreshMs) {
  const nextReloadAt = useRef(0)
  const [remainingMs, setRemainingMs] = useState(refreshMs)

  useEffect(() => {
    nextReloadAt.current = Date.now() + refreshMs

    const reloadInterval = window.setInterval(() => {
      window.location.reload()
    }, refreshMs)

    const countdownInterval = window.setInterval(() => {
      setRemainingMs(Math.max(0, nextReloadAt.current - Date.now()))
    }, 1000)

    return () => {
      window.clearInterval(reloadInterval)
      window.clearInterval(countdownInterval)
    }
  }, [refreshMs])

  return useMemo(() => formatRemaining(remainingMs), [remainingMs])
}
