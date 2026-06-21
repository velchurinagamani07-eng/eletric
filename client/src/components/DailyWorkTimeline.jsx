import { Clock3, MapPin } from 'lucide-react'
import {
  formatTimeLabel,
  getActiveEventInfo,
  getEntryState,
  getTimelineProgress,
} from '../utils/dailyWork'

export default function DailyWorkTimeline({ entries = [], now = new Date(), variant = 'page' }) {
  const { entries: sortedEntries, activeIndex } = getActiveEventInfo(entries, now)
  const progress = getTimelineProgress(sortedEntries, activeIndex)
  const isTv = variant === 'tv'

  if (!sortedEntries.length) {
    return (
      <div className={isTv ? 'py-10 text-center text-white/60' : 'rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500'}>
        No schedule entries yet.
      </div>
    )
  }

  return (
    <div
      className={`live-timeline relative ${isTv ? 'px-1 py-3' : 'rounded-lg border border-amber-100 bg-white p-4 shadow-sm sm:p-6'}`}
      style={{ '--timeline-progress': progress / 100 }}
    >
      <div className={`absolute bottom-9 top-9 w-1 rounded-full ${isTv ? 'left-7 bg-white/18' : 'left-8 bg-gray-200'}`} aria-hidden="true">
        <div className="absolute left-0 top-0 w-full rounded-full bg-[#F4C430]" style={{ height: `${progress}%` }} />
      </div>
      <div className={`timeline-car absolute z-20 ${isTv ? 'left-3 text-3xl' : 'left-[1.05rem] text-2xl'}`} aria-hidden="true">
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_8px_22px_rgba(15,23,42,0.22)]">
          🚗
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white live-pulse" />
        </span>
      </div>

      <div className={isTv ? 'space-y-3' : 'space-y-4'}>
        {sortedEntries.map((entry, index) => {
          const state = getEntryState(index, activeIndex)
          const isCurrent = state === 'current'
          const isCompleted = state === 'completed'
          const rowClasses = isTv
            ? `${isCurrent ? 'border-[#F4C430] bg-[#F4C430]/12 text-white shadow-[0_0_22px_rgba(244,196,48,0.16)]' : 'border-white/10 bg-white/[0.04]'}`
            : `${isCurrent ? 'border-amber-300 bg-amber-50 text-gray-950 shadow-[0_10px_28px_rgba(245,158,11,0.14)]' : isCompleted ? 'border-emerald-100 bg-emerald-50/60' : 'border-gray-200 bg-white'}`

          return (
            <article
              key={entry.id || `${entry.time}-${index}`}
              className={`relative ml-14 rounded-lg border p-3 transition-all duration-500 ${rowClasses} ${isTv ? 'min-h-[92px]' : 'min-h-[86px] sm:p-4'}`}
            >
              <span
                className={`absolute -left-[3.05rem] top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg ${
                  isCurrent
                    ? 'border-[#F4C430] bg-[#0a0a2e]'
                    : isCompleted
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {isCompleted ? '✅' : isCurrent ? '🔴' : '⏳'}
              </span>

              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={`flex items-center gap-2 font-black ${isTv ? 'text-[22px] text-[#F4C430]' : isCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <Clock3 size={isTv ? 22 : 17} />
                    {formatTimeLabel(entry.time)}
                  </p>
                  <h3
                    className={`mt-2 leading-snug ${
                      isTv
                        ? `${isCurrent ? 'text-[20px] font-black text-white' : isCompleted ? 'text-lg font-bold text-white/70 line-through decoration-white/30' : 'text-lg font-semibold text-white/74'}`
                        : `${isCurrent ? 'text-lg font-black text-gray-950' : isCompleted ? 'font-semibold text-gray-500 line-through decoration-gray-300' : 'font-semibold text-gray-800'}`
                    }`}
                  >
                    {entry.activity || 'Schedule activity'}
                  </h3>
                  {entry.location && (
                    <p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${isTv ? 'text-white/56' : 'text-gray-500'}`}>
                      <MapPin size={15} /> {entry.location}
                    </p>
                  )}
                </div>

                {isCurrent && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase ${isTv ? 'bg-red-500 text-white' : 'bg-red-500 text-white'} live-blink`}>
                    <span className="h-2 w-2 rounded-full bg-white" /> NOW
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
