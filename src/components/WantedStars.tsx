interface Props {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'lg'
}

export default function WantedStars({ value, onChange, size = 'sm' }: Props) {
  const cls = size === 'lg' ? 'text-4xl' : 'text-base'
  return (
    <div className={`flex gap-1 ${cls}`} role={onChange ? 'radiogroup' : undefined} aria-label="Wanted-Level">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value
        const star = (
          <span
            className={on ? 'text-sun [text-shadow:0_0_10px_#ff8a3d]' : 'text-white/20'}
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
