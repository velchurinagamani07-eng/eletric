import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'
import { Copy, ExternalLink, ImageIcon, MessageCircle, RefreshCw } from 'lucide-react'
import DailyWorkTimeline from '../components/DailyWorkTimeline'
import { useDailyWorkSchedule } from '../hooks/useDailyWorkSchedule'
import { useHeroDisplayImages } from '../hooks/useHeroDisplayImages'
import { useReloadCountdown } from '../hooks/useReloadCountdown'
import {
  buildDailyWorkShareText,
  formatDateDisplay,
  formatDayDisplay,
  formatTimeLabel,
  getActiveEventInfo,
  getLocalDateKey,
} from '../utils/dailyWork'

export default function DailyWork() {
  const dateKey = getLocalDateKey()
  const { schedule, error } = useDailyWorkSchedule(dateKey)
  const { images } = useHeroDisplayImages()
  const countdown = useReloadCountdown(300000)
  const [now, setNow] = useState(new Date())
  const [slideIndex, setSlideIndex] = useState(0)
  const [expandedPhotoId, setExpandedPhotoId] = useState('')

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (images.length < 2) return undefined
    const interval = window.setInterval(() => {
      setSlideIndex((value) => (value + 1) % images.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [images.length])

  const activeHero = images[slideIndex % images.length]
  const { activeEvent } = getActiveEventInfo(schedule.entries, now)
  const scheduleBanner = schedule.bannerImageUrl || activeHero?.imageURL || ''
  const shareText = useMemo(() => buildDailyWorkShareText(schedule), [schedule])
  const galleryPhotos = useMemo(
    () =>
      schedule.entries.flatMap((entry) =>
        (entry.tvPhotos || []).map((photo) => ({
          ...photo,
          eventId: entry.id,
          eventName: entry.activity,
          time: entry.time,
          location: entry.location,
        })),
      ),
    [schedule.entries],
  )

  const copySchedule = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('Schedule copied.')
    } catch (err) {
      toast.error(err.message || 'Unable to copy schedule.')
    }
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <Helmet>
        <title>Daily Work - MLA Narasaraopet</title>
        <meta name="description" content="Live daily schedule and public work updates for Dr. Chadalavada Aravinda Babu." />
      </Helmet>

      <main className="bg-[#F7F8FA] text-gray-900">
        <section className="relative min-h-[46vh] overflow-hidden bg-gray-950">
          {activeHero?.imageURL ? (
            <img src={activeHero.imageURL} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#1E3A5F] to-[#111827]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/16" />
          <div className="relative z-10 mx-auto flex min-h-[46vh] max-w-7xl flex-col justify-center px-4 py-12 text-white sm:px-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-300">Today&apos;s Schedule - Live</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{schedule.title}</h1>
            <p className="mt-4 text-lg font-semibold text-white/82">
              {formatDateDisplay(schedule.scheduleDate)} • {formatDayDisplay(schedule.scheduleDate)}
            </p>
          </div>
        </section>

        <div className="fixed right-3 top-[calc(var(--announcement-offset,0px)+0.75rem)] z-50 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/92 px-3 py-2 text-xs font-black text-amber-800 shadow-sm backdrop-blur lg:top-[calc(var(--announcement-offset,0px)+4.5rem)]">
          <RefreshCw size={14} /> Refreshing in {countdown}
        </div>

        <section className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6">
          {error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {error}
            </p>
          )}

          <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-gray-100">
              {scheduleBanner ? (
                <img src={scheduleBanner} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-gray-400">
                  <ImageIcon size={38} />
                </div>
              )}
              {activeEvent && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/62 px-4 py-3 text-white backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-300">Current Event</p>
                  <p className="mt-1 font-bold">{formatTimeLabel(activeEvent.time)} — {activeEvent.activity}</p>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7">
              <div className="text-center">
                <p className="text-2xl font-black text-amber-700">{schedule.greeting}</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                  {formatDateDisplay(schedule.scheduleDate)} • {formatDayDisplay(schedule.scheduleDate)}
                </p>
                <h2 className="mt-2 text-xl font-black text-navy sm:text-2xl">{schedule.mlaTitle}</h2>
              </div>

              <div className="mt-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-amber-200" />
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Animated Live Timeline</h3>
                  <span className="h-px flex-1 bg-amber-200" />
                </div>
                <DailyWorkTimeline entries={schedule.entries} now={now} />
              </div>

              <div className="mt-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">Closing Note</h3>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
                <p className="mx-auto max-w-3xl text-center text-base font-semibold leading-8 text-gray-600">{schedule.closingNote}</p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" className="btn-primary min-h-12" onClick={shareWhatsApp}>
                  <MessageCircle size={18} /> WhatsApp Share
                </button>
                <button type="button" className="btn-secondary min-h-12" onClick={copySchedule}>
                  <Copy size={18} /> Copy
                </button>
              </div>
            </div>
          </article>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Past Work Gallery</p>
                <h2 className="mt-1 text-2xl font-black text-navy">Completed event photos</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-500 shadow-sm">{galleryPhotos.length} photos</span>
            </div>

            {galleryPhotos.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryPhotos.map((photo) => {
                  const expanded = expandedPhotoId === photo.id
                  return (
                    <article key={`${photo.eventId}-${photo.id}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                      <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />
                      <div className="p-4">
                        <p className="text-sm font-black text-amber-700">{formatTimeLabel(photo.time)}</p>
                        <h3 className={`${expanded ? '' : 'line-clamp-2'} mt-1 font-bold text-navy`}>{photo.eventName}</h3>
                        {photo.location && <p className="mt-1 text-sm font-semibold text-gray-500">{photo.location}</p>}
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-black text-amber-700"
                          onClick={() => setExpandedPhotoId(expanded ? '' : photo.id)}
                        >
                          {expanded ? 'Show less' : 'Read more'} <ExternalLink size={14} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-5 py-12 text-center text-gray-500">
                <ImageIcon className="mx-auto mb-3" size={34} />
                <p className="font-semibold">No work photos uploaded yet.</p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  )
}
