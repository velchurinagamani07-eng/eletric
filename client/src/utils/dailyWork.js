export const IMGBB_TV_API_KEY = '202b1fcbad15a90cccbd9e2a44bcb4fa'

export const fallbackHeroDisplayImages = [
  {
    id: 'fallback-public-1',
    imageURL: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1800&q=82',
    caption: 'Public meeting',
  },
  {
    id: 'fallback-public-2',
    imageURL: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?auto=format&fit=crop&w=1800&q=82',
    caption: 'Constituency work',
  },
  {
    id: 'fallback-public-3',
    imageURL: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1800&q=82',
    caption: 'Community activity',
  },
]

const pad = (value) => String(value).padStart(2, '0')

export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dateFromKey(dateKey = getLocalDateKey()) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

export function formatDateDisplay(dateKey, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateFromKey(dateKey))
}

export function formatDayDisplay(dateKey, locale = 'te-IN') {
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(dateFromKey(dateKey))
}

export function parseTimeToMinutes(time = '') {
  const value = String(time).trim().toLowerCase()
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
  if (!match) return 24 * 60 + 1

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = match[3]

  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0

  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes))
}

export function formatTimeLabel(time = '') {
  const source = String(time).trim()
  if (!source) return ''
  if (/am|pm/i.test(source)) return source.toUpperCase().replace(/\s+/g, ' ')

  const minutes = parseTimeToMinutes(source)
  if (minutes > 24 * 60) return source
  const hours24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${pad(mins)} ${period}`
}

export function getCurrentMinutes(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes()
}

function normalizePhoto(photo, index, entry) {
  if (typeof photo === 'string') {
    return {
      id: `photo-${index}`,
      url: photo,
      thumbUrl: photo,
      deleteUrl: '',
      caption: entry?.activity || '',
    }
  }

  return {
    id: photo?.id || `photo-${index}`,
    url: photo?.url || photo?.displayUrl || photo?.imageURL || '',
    thumbUrl: photo?.thumbUrl || photo?.url || photo?.imageURL || '',
    deleteUrl: photo?.deleteUrl || '',
    caption: photo?.caption || entry?.activity || '',
    uploadedAt: photo?.uploadedAt || '',
  }
}

export function normalizeEntry(entry = {}, index = 0) {
  const next = {
    id: entry.id || `entry-${index + 1}`,
    time: entry.time || '',
    activity: entry.activity || entry.title || '',
    location: entry.location || '',
    notes: entry.notes || '',
    tvPhotos: [],
  }

  next.tvPhotos = (Array.isArray(entry.tvPhotos) ? entry.tvPhotos : [])
    .map((photo, photoIndex) => normalizePhoto(photo, photoIndex, next))
    .filter((photo) => photo.url)
    .slice(0, 10)

  return next
}

export function sortDailyEntries(entries = []) {
  return [...entries].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
}

export function createFallbackDailyWork(dateKey = getLocalDateKey()) {
  return {
    id: dateKey,
    scheduleDate: dateKey,
    title: 'నరసరావుపేట శాసనసభ్యులు డాక్టర్ చదలవాడ అరవింద బాబు నేటి పర్యటన వివరాలు',
    greeting: '🙏 అందరికి నమస్కారం 🙏',
    mlaTitle: 'డాక్టర్ చదలవాడ అరవింద బాబు — నరసరావుపేట ఎమ్మెల్యే',
    closingNote: 'ప్రజలు, పార్టీ నాయకులు, కార్యకర్తలు సంబంధిత కార్యక్రమాలకు సమయానికి హాజరు కావలసిందిగా కోరుచున్నాము.',
    bannerImageUrl: '',
    entries: [
      {
        id: 'morning-meeting',
        time: '09:00',
        activity: 'ప్రజా సమస్యల స్వీకరణ మరియు కార్యాలయ సమావేశం',
        location: 'ఎమ్మెల్యే కార్యాలయం',
        notes: '',
        tvPhotos: [],
      },
      {
        id: 'field-visit',
        time: '11:00',
        activity: 'నరసరావుపేట నియోజకవర్గ పర్యటన',
        location: 'నరసరావుపేట',
        notes: '',
        tvPhotos: [],
      },
      {
        id: 'review',
        time: '12:00',
        activity: 'అభివృద్ధి పనుల సమీక్ష',
        location: 'మున్సిపల్ కార్యాలయం',
        notes: '',
        tvPhotos: [],
      },
      {
        id: 'evening-program',
        time: '16:00',
        activity: 'పార్టీ నాయకులు మరియు కార్యకర్తలతో సమావేశం',
        location: 'నియోజకవర్గ కార్యాలయం',
        notes: '',
        tvPhotos: [],
      },
    ],
    updatedAt: '',
  }
}

export function normalizeDailyWork(data = {}, dateKey = getLocalDateKey()) {
  const fallback = createFallbackDailyWork(dateKey)
  const entries = Array.isArray(data.entries) && data.entries.length
    ? sortDailyEntries(data.entries.map(normalizeEntry))
    : fallback.entries

  return {
    ...fallback,
    ...data,
    id: data.id || dateKey,
    scheduleDate: data.scheduleDate || dateKey,
    title: data.title || fallback.title,
    greeting: data.greeting || fallback.greeting,
    mlaTitle: data.mlaTitle || fallback.mlaTitle,
    closingNote: data.closingNote || fallback.closingNote,
    bannerImageUrl: data.bannerImageUrl || data.bannerURL || data.imageURL || '',
    entries,
  }
}

export function getActiveEventInfo(entries = [], now = new Date()) {
  const sortedEntries = sortDailyEntries(entries)
  const currentMinutes = getCurrentMinutes(now)
  let activeIndex = -1

  for (let index = 0; index < sortedEntries.length; index += 1) {
    if (parseTimeToMinutes(sortedEntries[index].time) <= currentMinutes) activeIndex = index
  }

  if (activeIndex < 0) activeIndex = sortedEntries.length ? 0 : -1

  return {
    entries: sortedEntries,
    activeIndex,
    activeEvent: activeIndex >= 0 ? sortedEntries[activeIndex] : null,
    currentMinutes,
  }
}

export function getEntryState(index, activeIndex) {
  if (activeIndex < 0) return 'upcoming'
  if (index < activeIndex) return 'completed'
  if (index === activeIndex) return 'current'
  return 'upcoming'
}

export function getTimelineProgress(entries = [], activeIndex = 0) {
  if (!entries.length) return 0
  if (entries.length === 1) return 50
  return Math.max(0, Math.min(100, (activeIndex / (entries.length - 1)) * 100))
}

export function buildDailyWorkShareText(schedule) {
  const entries = sortDailyEntries(schedule.entries || [])
  const lines = [
    schedule.title,
    `${formatDateDisplay(schedule.scheduleDate)} • ${formatDayDisplay(schedule.scheduleDate)}`,
    '',
    ...entries.map((entry) => `${formatTimeLabel(entry.time)} — ${entry.activity}${entry.location ? `, ${entry.location}` : ''}`),
    '',
    schedule.closingNote,
  ].filter(Boolean)

  return lines.join('\n')
}

export function toSchedulePayload(form) {
  return {
    scheduleDate: form.scheduleDate,
    title: String(form.title || '').trim(),
    greeting: String(form.greeting || '').trim(),
    mlaTitle: String(form.mlaTitle || '').trim(),
    closingNote: String(form.closingNote || '').trim(),
    bannerImageUrl: form.bannerImageUrl || '',
    entries: sortDailyEntries(form.entries || []).map((entry, index) => ({
      id: entry.id || `entry-${index + 1}`,
      time: String(entry.time || '').trim(),
      activity: String(entry.activity || '').trim(),
      location: String(entry.location || '').trim(),
      notes: String(entry.notes || '').trim(),
      tvPhotos: (entry.tvPhotos || []).slice(0, 10).map((photo, photoIndex) => ({
        id: photo.id || `photo-${photoIndex + 1}`,
        url: photo.url,
        thumbUrl: photo.thumbUrl || photo.url,
        deleteUrl: photo.deleteUrl || '',
        caption: photo.caption || entry.activity || '',
        uploadedAt: photo.uploadedAt || '',
      })),
    })),
  }
}
