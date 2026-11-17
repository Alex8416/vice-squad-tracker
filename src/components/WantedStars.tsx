import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'lg'
}

export default function WantedStars({ value, onChange, size = 'sm' }: Props) {
  const cls = size === 'lg' ? 'text-4xl' : 'text-base'
  const prev = useRef(value)
  const [blink, setBlink] = useState(0)

  // Bei Änderung (nicht beim ersten Rendern) blinken die Sterne wie Blaulicht
  useEffect(() => {
    if (prev.current !== value) {
      if (value > prev.current) setBlink((b) => b + 1)
      prev.current = value
    }
  }, [value])

  return (
    <div
      key={blink}
      className={`flex gap-1 ${cls} ${blink ? 'wanted-blink' : ''}`}
      role={onChange ? 'radiogroup' : undefined}
      aria-label="Wanted-Level"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value
        const star = (
          <span
            className={`${on ? 'star-on text-sun [text-shadow:0_0_10px_#ff8a3d]' : 'text-white/20'} ${on && blink ? 'inline-block' : ''}`}
            style={on && blink ? { animationDelay: `${(n - 1) * 60}ms` } : undefined}
            aria-hidden
          >
            ★
          </span>
        )
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} Sterne`}
            onClick={() => onChange(n === value ? 0 : n)}
            className="transition-transform active:scale-90"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}
