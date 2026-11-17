import { useEffect, useMemo, useState } from 'react'
import { prefersReducedMotion } from '../lib/prefs'
import { sfx } from '../lib/sound'

type Kind = 'clear' | 'rain' | 'fog'

/** Wetter des Tages: für die ganze Crew gleich (aus dem Datum berechnet). */
function todaysWeather(): Kind {
  const d = new Date()
  const seed = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate()
  const r = ((Math.sin(seed * 9301 + 49297) * 233280) % 1 + 1) % 1
  if (r < 0.2) return 'rain'
  if (r < 0.32) return 'fog'
  return 'clear'
}

export default function Weather() {
  const kind = useMemo(todaysWeather, [])
  const [flash, setFlash] = useState(0)
  const reduced = prefersReducedMotion()

  // Gewitter: gelegentlich ein Blitz mit leisem Donner
  useEffect(() => {
    if (kind !== 'rain' || reduced) return
    let t: number
    const next = () => {
      t = window.setTimeout(() => {
        setFlash((f) => f + 1)
        window.setTimeout(() => sfx.thunder(), 400 + Math.random() * 900)
        next()
      }, 9000 + Math.random() * 16000)
    }
    next()
    return () => window.clearTimeout(t)
  }, [kind, reduced])

  const drops = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: Math.random() * 115,
        delay: -Math.random() * 2,
        dur: 0.55 + Math.random() * 0.45,
        opacity: 0.3 + Math.random() * 0.6,
      })),
    [],
  )

  if (kind === 'clear') return null

  if (kind === 'fog') return <div className="fog absolute -inset-x-[20%] inset-y-0" />

  return (
    <>
      <div className="absolute inset-0 bg-[#0b0420]/25" />
      {!reduced &&
        drops.map((d, i) => (
          <span
            key={i}
            className="raindrop"
            style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, ['--d' as string]: `${d.dur}s`, opacity: d.opacity }}
          />
        ))}
      {flash > 0 && <div key={flash} className="lightning absolute inset-0" />}
    </>
  )
}
