import type { CrewMember } from '../hooks/useCrew'
import { formatHours, formatMoney, formatNumber, timeAgo } from '../lib/format'
import { useCountUp } from '../hooks/useCountUp'
import Avatar from './Avatar'
import ProgressBar from './ProgressBar'
import WantedStars from './WantedStars'

interface Props {
  member: CrewMember
  rank: number
  flashKey: number
  isMe: boolean
}

export default function PlayerCard({ member, rank, flashKey, isMe }: Props) {
  const { profile, progress: p, points } = member
  const color = profile.avatar_color
  const money = useCountUp(Number(p?.money ?? 0), 1200)
  const pointsAnim = useCountUp(points)

  return (
    <article
      key={flashKey}
      className={`glass lift relative overflow-hidden p-4 ${flashKey ? 'neon-flash' : ''}`}
      style={{ boxShadow: `6px 6px 0 ${color}` }}
    >
      {/* Handy-Statusleiste */}
      <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-widest text-white/50">
        <span>#{rank} · CREW</span>
        <span>{isMe ? 'DU' : 'ONLINE'} ▮▮▮</span>
      </div>

      <div className="flex items-center gap-3">
        <Avatar name={profile.username} color={color} url={profile.avatar_url} size={56} />
        <div className="min-w-0">
          <div className="skew-header rounded-sm px-2 py-0.5" style={{ background: color }}>
            <h2 className="font-display truncate text-2xl leading-tight text-night">{profile.username}</h2>
          </div>
          <p className="mt-1 truncate text-xs font-semibold tracking-wide text-teal">{profile.crew_role || 'Rookie'}</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={p?.story_percent ?? 0} color={color} label="Story" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Stat label="Geld" value={formatMoney(Math.round(money))} accent="text-[#7dffb0]" />
        <Stat label="Missionen" value={formatNumber(p?.missions_done ?? 0)} />
        <Stat label="Spielzeit" value={formatHours(p?.playtime_hours ?? 0)} />
        <Stat label="Punkte" value={`${Math.round(pointsAnim)} P`} accent="text-sun" />
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <WantedStars value={p?.max_wanted_stars ?? 0} />
        <span className="text-xs text-white/50">💀 {p?.wasted_count ?? 0} · 🚔 {p?.busted_count ?? 0}</span>
      </div>

      {p?.current_mission && <p className="mt-3 truncate text-xs text-white/70">🎯 {p.current_mission}</p>}

      <p className="mt-3 min-h-[2.5rem] rounded-lg bg-night/50 px-3 py-2 text-sm italic text-white/85">
        {p?.status_message ? `„${p.status_message}“` : <span className="text-white/40">Kein Status</span>}
      </p>

      <p className="mt-2 text-right text-[11px] text-white/45">zuletzt aktiv {timeAgo(p?.updated_at)}</p>
    </article>
  )
}

function Stat({ label, value, accent = 'text-white' }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-widest text-white/50 uppercase">{label}</dt>
      <dd className={`font-semibold ${accent}`}>{value}</dd>
    </div>
  )
}
