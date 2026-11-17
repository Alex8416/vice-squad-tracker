import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { EventKind, Profile, ProgressEvent } from '../lib/database.types'
import { useToast } from '../context/ToastProvider'
import { useAuth } from '../context/AuthProvider'
import { useRealtime } from '../hooks/useRealtime'
import { timeAgo } from '../lib/format'
import Avatar from '../components/Avatar'
import PageTitle from '../components/PageTitle'

const kindStyle: Record<EventKind, { icon: string; color: string; label: string }> = {
  mission: { icon: '🎯', color: '#00e5d4', label: 'Mission' },
  milestone: { icon: '🌅', color: '#ffd23f', label: 'Meilenstein' },
  purchase: { icon: '💸', color: '#7dffb0', label: 'Einkauf' },
  achievement: { icon: '⭐', color: '#ff8a3d', label: 'Erfolg' },
  death: { icon: '💀', color: '#ff2e88', label: 'Pech' },
  note: { icon: '💬', color: '#c9b8ff', label: 'Notiz' },
}

const LIMIT = 100

export default function Feed() {
  const toast = useToast()
  const { session } = useAuth()
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) toast.error(error)
    if (data) setProfiles(Object.fromEntries(data.map((p) => [p.id, p])))
  }, [toast])

  useEffect(() => {
    void (async () => {
      const [{ data, error }] = await Promise.all([
        supabase.from('progress_events').select('*').order('created_at', { ascending: false }).limit(LIMIT),
        loadProfiles(),
      ])
      if (error) toast.error(error, 'FEED NICHT GELADEN')
      if (data) setEvents(data)
      setLoading(false)
    })()
  }, [toast, loadProfiles])

  useRealtime('progress_events', (payload) => {
    if (payload.eventType === 'INSERT') {
      const ev = payload.new
      setEvents((prev) => (prev.some((e) => e.id === ev.id) ? prev : [ev, ...prev].slice(0, LIMIT)))
      setFresh((f) => new Set(f).add(ev.id))
      if (!profiles[ev.user_id]) void loadProfiles()
    } else if (payload.eventType === 'DELETE' && payload.old.id) {
      setEvents((prev) => prev.filter((e) => e.id !== payload.old.id))
    }
  })

  const remove = async (id: number) => {
    const { error } = await supabase.from('progress_events').delete().eq('id', id)
    if (error) toast.error(error, 'LÖSCHEN FEHLGESCHLAGEN')
    else setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <section className="mx-auto max-w-2xl">
      <PageTitle sub="Was die Crew so treibt · live">Activity Feed</PageTitle>
      {loading ? (
        <p className="text-white/60">Lade Feed …</p>
      ) : events.length === 0 ? (
        <p className="text-white/60">Noch nichts passiert. Trag deinen Fortschritt ein!</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev, idx) => {
            const p = profiles[ev.user_id]
            const k = kindStyle[ev.kind] ?? kindStyle.note
            return (
              <li
                key={ev.id}
                className={`glass flex gap-3 border-l-4 p-3 ${fresh.has(ev.id) ? 'notif-in neon-flash' : 'stagger-in'}`}
                style={{ borderLeftColor: k.color, ['--i' as string]: Math.min(idx, 12) }}
              >
                <Avatar name={p?.username ?? '?'} color={p?.avatar_color ?? '#888'} url={p?.avatar_url} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold" style={{ color: p?.avatar_color }}>
                      {p?.username ?? 'Unbekannt'}
                    </span>{' '}
                    <span className="text-white/50">· {timeAgo(ev.created_at)}</span>
                  </p>
                  <p className="mt-0.5 font-semibold">
                    {k.icon} {ev.title}
                  </p>
                  <p className="mt-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: k.color }}>
                    {k.label}
                  </p>
                </div>
                {ev.user_id === session?.user.id && (
                  <button type="button" onClick={() => remove(ev.id)} aria-label="Eintrag löschen" className="self-start px-1 text-white/40 hover:text-pink">
                    ✕
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
