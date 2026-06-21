import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CircleDot, ImageIcon, RefreshCw } from 'lucide-react'
import DailyWorkTimeline from '../components/DailyWorkTimeline'
import { useDailyWorkSchedule } from '../hooks/useDailyWorkSchedule'
import { useHeroDisplayImages } from '../hooks/useHeroDisplayImages'
import { useReloadCountdown } from '../hooks/useReloadCountdown'
import {
  formatDateDisplay,
  formatDayDisplay,
  formatTimeLabel,
  getActiveEventInfo,
  getLocalDateKey,
} from '../utils/dailyWork'

function normalizeUpdatedAt(value) {
  if (!value) return new Date()
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function selectTvSlides(schedule, heroImages, now) {
  const { entries, activeIndex, activeEvent } = getActiveEventInfo(schedule.entries, now)

  const toSlides = (event) =>
    (event?.tvPhotos || []).map((photo) => ({
      id: `${event.id}-${photo.id}`,
      imageURL: photo.url,
      caption: photo.caption || event.activity,
      eventName: event.activity,
      time: event.time,
      source: 'daily-work',
    }))

  const activeSlides = toSlides(activeEvent)
  if (activeSlides.length) return { slides: activeSlides, event: activeEvent, source: 'current' }

  for (let index = activeIndex; index >= 0; index -= 1) {
    const event = entries[index]
    const slides = toSlides(event)
    if (slides.length) return { slides, event, source: 'completed' }
  }

  return {
    slides: heroImages.map((image, index) => ({
      id: image.id || `hero-${index + 1}`,
      imageURL: image.imageURL,
      caption: image.caption || schedule.title,
      eventName: activeEvent?.activity || schedule.title,
      time: activeEvent?.time || '',
      source: 'hero',
    })),
    event: activeEvent,
    source: 'hero',
  }
}

export default function TVDisplay() {
  const dateKey = getLocalDateKey()
  const { schedule } = useDailyWorkSchedule(dateKey)
  const { images: heroImages } = useHeroDisplayImages()
  const countdown = useReloadCountdown(600000)
  const [clockNow, setClockNow] = useState(new Date())
  const [timelineNow, setTimelineNow] = useState(new Date())
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setTimelineNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const { slides, event: selectedEvent, source } = useMemo(
    () => selectTvSlides(schedule, heroImages, timelineNow),
    [heroImages, schedule, timelineNow],
  )

  useEffect(() => {
    if (slides.length < 2) return undefined
    const interval = window.setInterval(() => {
      setSlideIndex((value) => (value + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [slides.length])

  const safeSlideIndex = slides.length ? slideIndex % slides.length : 0
  const activeSlide = slides[safeSlideIndex]
  const updatedAt = normalizeUpdatedAt(schedule.updatedAt)

  return (
    <>
      <Helmet>
        <title>TV Display - Daily Work</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main
        className="min-h-screen overflow-hidden bg-black text-white"
        style={{ fontFamily: '"Noto Sans Telugu", "Plus Jakarta Sans", Inter, system-ui, sans-serif' }}
      >
        <header className="grid min-h-[118px] grid-cols-[120px_1fr_180px] items-center gap-4 bg-gradient-to-r from-[#F8D34B] via-[#F4B400] to-[#D99300] px-7 text-[#0A1628] shadow-[0_10px_35px_rgba(0,0,0,0.28)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-[#0A1628]/20 bg-[#0A1628] text-2xl font-black text-[#F8D34B] shadow-lg">
            TDP
          </div>
          <div className="text-center">
            <h1 className="text-[30px] font-black leading-tight">{schedule.title}</h1>
            <p className="mt-2 flex items-center justify-center gap-3 text-[20px] font-black">
              {formatDateDisplay(schedule.scheduleDate, 'te-IN')} • {formatDayDisplay(schedule.scheduleDate)}
              <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-black text-white live-blink">
                <span className="h-2.5 w-2.5 rounded-full bg-white" /> LIVE
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0A1628]/65">Current Time</p>
            <p className="mt-2 font-mono text-[30px] font-black tabular-nums">
              {clockNow.toLocaleTimeString('en-IN', { hour12: false })}
            </p>
          </div>
        </header>

        <section className="grid h-[calc(100vh-118px)] grid-cols-[30%_70%]">
          <aside className="flex min-w-0 flex-col bg-[#0a0a2e] px-5 py-5">
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F4C430]">Today&apos;s Schedule</p>
              <h2 className="mt-1 text-[28px] font-black">నేటి కార్యక్రమాలు</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <DailyWorkTimeline entries={schedule.entries} now={timelineNow} variant="tv" />
            </div>

            <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm font-bold text-white/74">
              <p className="flex items-center gap-2">
                <RefreshCw size={15} className="text-[#F4C430]" /> Auto refresh in {countdown}
              </p>
              <p>Last updated: {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </aside>

          <section className="relative min-w-0 overflow-hidden bg-gray-950">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
            {slides.map((slide, index) => (
              <img
                key={slide.id || index}
                src={slide.imageURL}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === safeSlideIndex ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}

            {!activeSlide?.imageURL && (
              <div className="absolute inset-0 grid place-items-center text-white/35">
                <ImageIcon size={72} />
              </div>
            )}

            <div className="absolute right-5 top-5 rounded-full bg-black/58 px-4 py-2 text-sm font-black text-white backdrop-blur">
              Photos: {slides.length ? `${safeSlideIndex + 1} of ${slides.length}` : '0 of 0'}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-black/72 px-7 py-5 backdrop-blur">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#F4C430]">
                    <CircleDot size={16} className="text-red-500" fill="currentColor" />
                    {source === 'hero' ? 'Hero Images Fallback' : source === 'current' ? 'Current Event Photos' : 'Completed Event Photos'}
                  </p>
                  <h2 className="mt-2 text-[30px] font-black leading-tight">
                    {activeSlide?.eventName || selectedEvent?.activity || schedule.title}
                  </h2>
                  {(activeSlide?.time || selectedEvent?.time) && (
                    <p className="mt-1 text-xl font-black text-white/76">{formatTimeLabel(activeSlide?.time || selectedEvent?.time)}</p>
                  )}
                </div>
                <div className="flex max-w-[36%] items-center justify-end gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={`${slide.id || index}-dot`}
                      type="button"
                      className={`h-3 rounded-full transition-all ${index === safeSlideIndex ? 'w-10 bg-[#F4C430]' : 'w-3 bg-white/48'}`}
                      onClick={() => setSlideIndex(index)}
                      aria-label={`Show TV photo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </>
  )
}
