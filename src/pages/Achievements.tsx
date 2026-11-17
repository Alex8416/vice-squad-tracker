import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCrew } from '../hooks/useCrew'
import { useAuth } from '../context/AuthProvider'
import { useToast } from '../context/ToastProvider'
import type { Achievement } from '../lib/database.types'
import Avatar from '../components/Avatar'
import PageTitle from '../components/PageTitle'
import { fx } from '../lib/fx'

export default function Achievements() {
  const { members, achievements, setUnlocks, loading } = useCrew()
  const { session } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const me = session?.user.id
  const mine = members.find((m) => m.profile.id === me)

  const toggle = async (a: Achievement) => {
    if (!me) return
    setBusy(a.id)
    const has = mine?.unlocked.has(a.id)
    if (has) {
      const { error } = await supabase.from('user_achievements').delete().eq('user_id', me).eq('achievement_id', a.id)
      if (error) toast.error(error, 'FEHLGESCHLAGEN')
      else setUnlocks((u) => u.filter((x) => !(x.user_id === me && x.achievement_id === a.id)))
    } else {
      const { data, error } = await supabase.from('user_achievements').insert({ user_id: me, achievement_id: a.id }).select().single()
      if (error) toast.error(error, 'FEHLGESCHLAGEN')
      else {
        setUnlocks((u) => (u.some((x) => x.user_id === me && x.achievement_id === a.id) ? u : [...u, data]))
        toast.show('passed', 'ERFOLG FREIGESCHALTET', `${a.icon ?? '⭐'} ${a.title} · +${a.points} P`)
        fx.emit({ type: 'confetti', amount: 120 })
        const { error: evErr } = await supabase
          .from('progress_events')
          .insert({ user_id: me, kind: 'achievement', title: `Erfolg: ${a.title}`.slice(0, 120), details: { achievement_id: a.id, points: a.points } })
        if (evErr) toast.error(evErr, 'FEED-EINTRAG FEHLGESCHLAGEN')
      }
    }
    setBusy(null)
  }

  const total = achievements.reduce((s, a) => s + a.points, 0)

  return (
    <section>
      <PageTitle sub={`Deine Punkte: ${mine?.points ?? 0} / ${total} · Tippen zum An-/Abhaken`}>Achievements</PageTitle>
      {loading ? (
        <p className="text-white/60">Lade Erfolge …</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a, i) => {
            const unlocked = mine?.unlocked.has(a.id) ?? false
            const owners = members.filter((m) => m.unlocked.has(a.id))
            return (
              <button
                key={a.id}
                type="button"
                disabled={busy === a.id}
                onClick={() => toggle(a)}
                aria-pressed={unlocked}
                style={{ ['--i' as string]: i }}
                className={`glass lift stagger-in flex flex-col p-4 text-left ${unlocked ? 'shadow-pink border-pink/60' : 'opacity-80 hover:opacity-100'}`}
              >
                <div className="flex items-start gap-3">
                  <span key={String(unlocked)} className={`text-4xl ${unlocked ? 'star-pop' : 'grayscale'}`}>
                    {a.icon ?? '⭐'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight">{a.title}</p>
                    {a.description && <p className="text-sm text-white/70">{a.description}</p>}
                  </div>
                  <span className="rounded-md bg-sun/90 px-2 py-0.5 text-xs font-bold text-night">{a.points} P</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {owners.slice(0, 8).map((m) => (
                      <Avatar key={m.profile.id} name={m.profile.username} color={m.profile.avatar_color} url={m.profile.avatar_url} size={26} />
                    ))}
                    {owners.length === 0 && <span className="text-xs text-white/40">Noch niemand</span>}
                    {owners.length > 8 && <span className="pl-3 text-xs text-white/60">+{owners.length - 8}</span>}
                  </div>
                  <span className={`text-xs font-bold tracking-widest ${unlocked ? 'text-teal' : 'text-white/40'}`}>
                    {unlocked ? '✓ GESCHAFFT' : 'OFFEN'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
