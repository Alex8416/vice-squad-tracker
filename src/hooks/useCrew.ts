import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Achievement, Profile, Progress, UserAchievement } from '../lib/database.types'
import { useToast } from '../context/ToastProvider'
import { useRealtime } from './useRealtime'

export interface CrewMember {
  profile: Profile
  progress: Progress | null
  points: number
  unlocked: Set<string>
}

/** Lädt Profile, Fortschritt und Achievements der ganzen Crew, live aktualisiert. */
export function useCrew() {
  const toast = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlocks, setUnlocks] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<Record<string, number>>({})
  const profileIds = useRef(new Set<string>())

  const load = useCallback(async () => {
    const [p, pr, a, ua] = await Promise.all([
      supabase.from('profiles').select('*').order('username'),
      supabase.from('progress').select('*'),
      supabase.from('achievements').select('*').order('sort'),
      supabase.from('user_achievements').select('*'),
    ])
    const err = p.error ?? pr.error ?? a.error ?? ua.error
    if (err) toast.error(err, 'CREW NICHT GELADEN')
    if (p.data) {
      setProfiles(p.data)
      profileIds.current = new Set(p.data.map((x) => x.id))
    }
    if (pr.data) setProgress(Object.fromEntries(pr.data.map((r) => [r.user_id, r])))
    if (a.data) setAchievements(a.data)
    if (ua.data) setUnlocks(ua.data)
    setLoading(false)
  }, [toast])

  useEffect(() => {
    void load()
    // Profile sind nicht im Realtime-Publish: beim Zurückkehren in den Tab neu laden
    const onFocus = () => document.visibilityState === 'visible' && void load()
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [load])

  const pulse = useCallback((userId: string) => {
    setFlash((f) => ({ ...f, [userId]: (f[userId] ?? 0) + 1 }))
  }, [])

  useRealtime('progress', (payload) => {
    if (payload.eventType === 'DELETE') return
    const row = payload.new
    setProgress((prev) => ({ ...prev, [row.user_id]: row }))
    if (!profileIds.current.has(row.user_id)) void load() // neues Crew-Mitglied
    pulse(row.user_id)
  })

  useRealtime('user_achievements', (payload) => {
    if (payload.eventType === 'INSERT') {
      const row = payload.new
      setUnlocks((prev) =>
        prev.some((u) => u.user_id === row.user_id && u.achievement_id === row.achievement_id) ? prev : [...prev, row],
      )
      pulse(row.user_id)
    } else if (payload.eventType === 'DELETE') {
      const old = payload.old
      // Ohne REPLICA IDENTITY FULL kommt bei DELETE evtl. nur der Primärschlüssel – der reicht hier.
      if (old.user_id && old.achievement_id) {
        setUnlocks((prev) => prev.filter((u) => !(u.user_id === old.user_id && u.achievement_id === old.achievement_id)))
        pulse(old.user_id)
      } else {
        void load()
      }
    }
  })

  const members = useMemo<CrewMember[]>(() => {
    const pts = Object.fromEntries(achievements.map((a) => [a.id, a.points]))
    return profiles.map((profile) => {
      const mine = unlocks.filter((u) => u.user_id === profile.id)
      return {
        profile,
        progress: progress[profile.id] ?? null,
        points: mine.reduce((s, u) => s + (pts[u.achievement_id] ?? 0), 0),
        unlocked: new Set(mine.map((u) => u.achievement_id)),
      }
    })
  }, [profiles, progress, achievements, unlocks])

  return { members, achievements, unlocks, setUnlocks, loading, flash, reload: load }
}
