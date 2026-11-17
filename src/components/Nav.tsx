import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Crew', icon: '🌴', end: true },
  { to: '/leaderboard', label: 'Ranking', icon: '🏆' },
  { to: '/me', label: 'Ich', icon: '🎮' },
  { to: '/feed', label: 'Feed', icon: '📡' },
  { to: '/achievements', label: 'Erfolge', icon: '⭐' },
  { to: '/profile', label: 'Profil', icon: '🪪' },
]

export function NavLinks({ variant }: { variant: 'top' | 'bottom' }) {
  return (
    <>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            variant === 'bottom'
              ? `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold ${isActive ? 'bg-pink/25 text-white' : 'text-white/65'}`
              : `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-pink text-white shadow-[3px_3px_0_#00e5d4]' : 'text-white/75 hover:bg-white/10'}`
          }
        >
          {variant === 'bottom' && <span className="text-lg leading-none">{it.icon}</span>}
          {it.label}
        </NavLink>
      ))}
    </>
  )
}
