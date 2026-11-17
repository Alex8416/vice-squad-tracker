import { useMemo, useState } from 'react'
import { useCrew, type CrewMember } from '../hooks/useCrew'
import { useAuth } from '../context/AuthProvider'
import PlayerCard from '../components/PlayerCard'
import PageTitle from '../components/PageTitle'

type SortKey = 'story' | 'money' | 'playtime' | 'points'

const sorts: { key: SortKey; label: string; get: (m: CrewMember) => number }[] = [
  { key: 'story', label: 'Story %', get: (m) => Number(m.progress?.story_percent ?? 0) },
  { key: 'money', label: 'Geld', get: (m) => Number(m.progress?.money ?? 0) },
  { key: 'playtime', label: 'Spielzeit', get: (m) => Number(m.progress?.playtime_hours ?? 0) },
  { key: 'points', label: 'Punkte', get: (m) => m.points },
]

export default function Crew() {
  const { members, loading, flash } = useCrew()
  const { session } = useAuth()
  const [sort, setSort] = useState<SortKey>('story')

  const sorted = useMemo(() => {
    const get = sorts.find((s) => s.key === sort)!.get
    return [...members].sort((a, b) => get(b) - get(a))
  }, [members, sort])

  return (
    <section>
      <PageTitle sub={`${members.length} Mitglieder · live`}>Die Crew</PageTitle>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Sortierung">
        {sorts.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={sort === s.key}
            onClick={() => setSort(s.key)}
            className={`btn shrink-0 px-3 py-1.5 text-sm ${sort === s.key ? 'btn-teal' : 'btn-ghost'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/60">Lade Crew …</p>
      ) : sorted.length === 0 ? (
        <p className="text-white/60">Noch niemand hier.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m, i) => (
            <PlayerCard
              key={m.profile.id}
              member={m}
              rank={i + 1}
              flashKey={flash[m.profile.id] ?? 0}
              isMe={m.profile.id === session?.user.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}
