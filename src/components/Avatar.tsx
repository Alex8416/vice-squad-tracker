import { useState } from 'react'
import { initials } from '../lib/format'

interface Props {
  name: string
  color: string
  url?: string | null
  size?: number
  className?: string
}

export default function Avatar({ name, color, url, size = 40, className = '' }: Props) {
  const [broken, setBroken] = useState(false)
  const style = { width: size, height: size, borderColor: color, boxShadow: `0 0 10px ${color}88` }
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name}
        title={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full border-2 object-cover ${className}`}
        style={style}
      />
    )
  }
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full border-2 font-bold text-night ${className}`}
      style={{ ...style, background: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  )
}
