import type { ReactNode } from 'react'

export default function PageTitle({ children, sub, right }: { children: ReactNode; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display title-skew neon-pink text-4xl sm:text-5xl">{children}</h1>
        {sub && <p className="mt-1 text-sm text-white/70">{sub}</p>}
      </div>
      {right}
    </div>
  )
}
