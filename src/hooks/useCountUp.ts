import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Zählt sanft vom alten zum neuen Wert hoch (wie ein Kontostand im Spiel). */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(reduced() ? target : 0)
  const from = useRef(value)

  useEffect(() => {
    if (reduced()) {
      setValue(target)
      from.current = target
      return
    }
    const start = performance.now()
    const startVal = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = startVal + (target - startVal) * eased
      setValue(v)
      from.current = v
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
