import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../lib/prefs'

const SLOGANS = ['VICE SQUAD 4 LIFE', 'LEONIDA ODER NIX', 'CREW > SOLO', 'HEUTE ABEND ZOCKEN?', 'WER HAT DIE MEISTEN STERNE?', 'SONNE, STRAND, STRAFZETTEL']

interface Flight {
  id: number
  kind: 'birds' | 'plane'
  top: number
  dur: number
  slogan: string
  reverse: boolean
}

function Birds() {
  const birds = [
    [0, 0],
    [-26, 12],
    [-26, -12],
    [-52, 22],
    [-52, -20],
    [-80, 4],
  ]
  return (
    <svg width="120" height="60" viewBox="-100 -30 120 60" className="opacity-80">
      {birds.map(([x, y], i) => (
        <path
          key={i}
          className="flap"
          style={{ animationDelay: `${i * 0.09}s` }}
          d={`M${x - 8} ${y} q4 -5 8 0 q4 -5 8 0`}
          fill="none"
          stroke="#0b0420"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function Plane({ slogan }: { slogan: string }) {
  const w = slogan.length * 11 + 30
  return (
    <svg width={w + 90} height="50" viewBox={`0 0 ${w + 90} 50`}>
      {/* Banner */}
      <g className="banner-wave">
        <line x1={w} y1="24" x2={w + 22} y2="24" stroke="#0b0420" strokeWidth="1.5" />
        <rect x="0" y="12" width={w} height="24" rx="2" fill="#ffd23f" stroke="#0b0420" strokeWidth="1.5" />
        <text x={w / 2} y="29" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="15" fill="#0b0420">
          {slogan}
        </text>
      </g>
      {/* Kleines Propellerflugzeug */}
      <g transform={`translate(${w + 22} 10)`} fill="#0b0420">
        <path d="M0 14 L44 10 Q60 12 62 15 Q60 18 44 19 L0 16 Z" />
        <path d="M22 13 L32 0 L38 0 L33 13 Z" />
        <path d="M22 17 L32 30 L38 30 L33 17 Z" />
        <path d="M0 14 L-4 6 L4 6 L8 14 Z" />
        <rect x="62" y="6" width="2" height="18" opacity="0.6" />
      </g>
    </svg>
  )
}

/** Ab und zu fliegt ein Vogelschwarm oder ein Flugzeug mit Werbebanner durchs Bild. */
export default function Flyovers() {
  const [flight, setFlight] = useState<Flight | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let t: number
    let id = 0
    const schedule = (delay: number) => {
      t = window.setTimeout(() => {
        const plane = Math.random() < 0.35
        setFlight({
          id: ++id,
          kind: plane ? 'plane' : 'birds',
          top: 8 + Math.random() * 22,
          dur: plane ? 30 + Math.random() * 10 : 18 + Math.random() * 8,
          slogan: SLOGANS[Math.floor(Math.random() * SLOGANS.length)]!,
          reverse: !plane && Math.random() < 0.5,
        })
        schedule(25000 + Math.random() * 35000)
      }, delay)
    }
    schedule(6000 + Math.random() * 8000)
    return () => window.clearTimeout(t)
  }, [])

  if (!flight) return null
  return (
    <div className="absolute inset-x-0" style={{ top: `${flight.top}vh`, transform: flight.reverse ? 'scaleX(-1)' : undefined }}>
      <div
        key={flight.id}
        className="fly-across absolute left-0"
        style={{ ['--dur' as string]: `${flight.dur}s` }}
        onAnimationEnd={() => setFlight(null)}
      >
        {flight.kind === 'plane' ? <Plane slogan={flight.slogan} /> : <Birds />}
      </div>
    </div>
  )
}
