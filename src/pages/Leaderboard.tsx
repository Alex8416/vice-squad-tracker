import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { LeaderboardRow } from '../lib/database.types'
import { useToast } from '../context/ToastProvider'
import { useRealtime } from '../hooks/useRealtime'
import { formatHours, formatMoney, formatPercent } from '../lib/format'
import Avatar from '../components/Avatar'
import PageTitle from '../components/PageTitle'

const podium = [
  { color: '#ffd23f', label: '🥇', cls: 'shadow-[0_0_18px_#ffd23f88] border-gold/70' },
  { color: '#d6e2ff', label: '🥈', cls: 'shadow-[0_0_18px_#d6e2ff66] border-silver/60' },
  { color: '#ff9a5a', label: '🥉', cls: 'shadow-[0_0_18px_#ff9a5a77] border-bronze/60' },
]

type SortKey = 'story_percent' | 'achievement_points' | 'money' | 'playtime_hours'
const sortLabels: Record<SortKey, string> = {
  story_percent: 'Story',
  achievement_points: 'Punkte',
  money: 'Geld',
  playtime_hours: 'Spielzeit',
}

export default function Leaderboard() {
  const toast = useToast()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [sort, setSort] = useState<SortKey>('story_percent')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('leaderboard').select('*')
    if (error) toast.error(error, 'RANKING NICHT GELADEN')
    if (data) setRows(data)
    setLoading(false)
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])
  useRealtime('progress', () => void load())
  useRealtime('user_achievements', () => void load())

  const sorted = [...rows].sort((a, b) => Number(b[sort]) - Number(a[sort]))

  return (
    <section>
      <PageTitle sub="Live-Ranking der Crew">Leaderboard</PageTitle>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(sortLabels) as SortKey[]).map((k) => (
          <button key={k} type="button" onClick={() => setSort(k)} className={`btn shrink-0 px-3 py-1.5 text-sm ${sort === k ? 'btn-teal' : 'btn-ghost'}`}>
            {sortLabels[k]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/60">Lade Ranking …</p>
      ) : (
        <ol className="space-y-3">
          {sorted.map((r, i) => {
            const pod = podium[i]
            return (
              <li key={r.id} className={`glass flex items-center gap-3 border-2 p-3 ${pod ? pod.cls : 'border-transparent'}`}>
                <span
                  className="font-display w-10 text-center text-3xl"
                  style={pod ? { color: pod.color, textShadow: `0 0 12px ${pod.color}` } : { color: '#ffffff88' }}
                >
                  {i + 1}
                </span>
                <Avatar name={r.username} color={r.avatar_color} url={r.avatar_url} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {pod?.label} {r.username}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {r.crew_role || 'Rookie'} · {r.missions_done} Missionen · 💀 {r.wasted_count} · 🚔 {r.busted_count}
                  </p>
                </div>
                <div className="hidden gap-5 text-right text-sm sm:flex">
                  <Cell label="Story" value={formatPercent(r.story_percent)} active={sort === 'story_percent'} />
                  <Cell label="Geld" value={formatMoney(r.money)} active={sort === 'money'} />
                  <Cell label="Zeit" value={formatHours(r.playtime_hours)} active={sort === 'playtime_hours'} />
                  <Cell label="Punkte" value={String(r.achievement_points)} active={sort === 'achievement_points'} />
                </div>
                <div className="text-right text-sm sm:hidden">
                  <p className="font-bold text-sun">
                    {sort === 'money'
                      ? formatMoney(r.money)
                      : sort === 'playtime_hours'
                        ? formatHours(r.playtime_hours)
                        : sort === 'achievement_points'
                          ? `${r.achievement_points} P`
                          : formatPercent(r.story_percent)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function Cell({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="min-w-16">
      <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">{label}</p>
      <p className={active ? 'font-bold text-sun' : 'font-semibold'}>{value}</p>
    </div>
  )
}
