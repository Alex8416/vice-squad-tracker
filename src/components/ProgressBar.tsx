export default function ProgressBar({ value, color = '#ff2e88', label }: { value: number; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs font-semibold text-white/75">
          <span>{label}</span>
          <span>{v.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${color}, #ffd23f)`, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
    </div>
  )
}
