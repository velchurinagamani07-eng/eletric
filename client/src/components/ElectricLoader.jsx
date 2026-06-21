const sparks = [
  { left: '16%', top: '34%', sx: '-18px', sy: '-16px' },
  { left: '78%', top: '28%', sx: '20px', sy: '-18px' },
  { left: '72%', top: '70%', sx: '22px', sy: '18px' },
  { left: '24%', top: '74%', sx: '-20px', sy: '20px' },
  { left: '50%', top: '15%', sx: '0px', sy: '-24px' },
  { left: '52%', top: '86%', sx: '4px', sy: '24px' },
]

export default function ElectricLoader({ label = 'Home Electric Services', compact = false, mini = false }) {
  const isInline = compact || mini

  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#0A0A0A] text-white ${
        isInline ? 'min-h-[220px] rounded-lg border border-red-900/30' : 'fixed inset-0 z-[100] min-h-screen'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`${mini ? 'h-16 w-16' : 'h-24 w-24'} relative flex items-center justify-center`}>
        <div className="absolute h-full w-full rounded-full bg-red-600/20 animate-ping-slow" />
        <div className="absolute h-2/3 w-2/3 rounded-full bg-amber-500/15 animate-ping-slower" />

        <svg
          viewBox="0 0 24 24"
          className={`${mini ? 'h-9 w-9' : 'h-14 w-14'} relative z-10 animate-bolt-flicker`}
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <path
            d="M13 2 4.5 14h6l-1 8 10-12h-6l1-8Z"
            fill="url(#boltGradient)"
            stroke="#FFFFFF"
            strokeWidth="0.5"
          />
          <path
            d="M5 7c3-3 6-3 9 0M9 18c3 1 6 0 9-4"
            stroke="#FCA5A5"
            strokeDasharray="2 3"
            strokeLinecap="round"
            className="animate-[bolt-draw_1s_ease-in-out_infinite_alternate]"
          />
        </svg>

        {sparks.map((spark, index) => (
          <span
            key={`${spark.left}-${spark.top}`}
            className={`absolute h-1.5 w-1.5 rounded-full bg-amber-400 animate-spark-${index}`}
            style={{
              left: spark.left,
              top: spark.top,
              '--sx': spark.sx,
              '--sy': spark.sy,
            }}
          />
        ))}
      </div>

      <p className={`${mini ? 'mt-4 text-xs' : 'mt-6 text-sm'} animate-pulse font-semibold uppercase tracking-wide text-white`}>
        {label}
      </p>
      <div className={`${mini ? 'mt-3 w-24' : 'mt-4 w-32'} h-1 overflow-hidden rounded-full bg-zinc-800`}>
        <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-red-700 via-red-600 to-amber-500" />
      </div>
    </div>
  )
}
