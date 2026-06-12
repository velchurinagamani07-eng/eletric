import { Bolt } from 'lucide-react'

export default function ElectricLoader({ label = 'Home Electric Services', compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-[#0F2744] text-white ${compact ? 'min-h-[240px] rounded-xl' : 'min-h-[55vh]'}`}>
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
          <path
            className="electric-line"
            d="M65 8 28 64h28l-8 48 43-64H61Z"
            fill="none"
            stroke="#F59E0B"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="7"
          />
          {[
            ['16px', '-22px', 18, 24],
            ['28px', '-4px', 94, 30],
            ['20px', '22px', 96, 82],
            ['-24px', '18px', 30, 90],
            ['-28px', '-8px', 18, 48],
            ['2px', '30px', 61, 104],
          ].map(([x, y, cx, cy], index) => (
            <circle
              key={`${cx}-${cy}`}
              className="spark-particle"
              cx={cx}
              cy={cy}
              r="3"
              fill="#F59E0B"
              style={{ '--spark-x': x, '--spark-y': y, animationDelay: `${index * 0.12}s` }}
            />
          ))}
        </svg>
        <Bolt className="absolute text-amber-400 opacity-20" size={50} />
      </div>
      <p className="mt-2 animate-pulse text-sm font-bold tracking-wide text-amber-100">{label}</p>
      <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-[shimmer_1.5s_infinite] rounded-full bg-amber-500" />
      </div>
    </div>
  )
}
