import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { EventKind, Json, Progress, ProgressUpdate } from '../lib/database.types'
import { useAuth } from '../context/AuthProvider'
import { useToast } from '../context/ToastProvider'
import { formatMoney } from '../lib/format'

interface NewEvent {
  kind: EventKind
  title: string
  details?: Json
}

const MILESTONES = [25, 50, 75, 100]
const MILLION = 1_000_000

/** Ermittelt Feed-Events aus dem Sprung zwischen altem und neuem Stand. */
export function diffEvents(before: Progress, after: Progress): NewEvent[] {
  const events: NewEvent[] = []
  const missions = after.missions_done - before.missions_done
  if (missions > 0) {
    const name = after.current_mission?.trim()
    events.push({
      kind: 'mission',
      title: missions === 1 ? `Mission erledigt${name ? `: ${name}` : ''}` : `${missions} Missionen erledigt`,
      details: { missions_done: after.missions_done },
    })
  }
  for (const m of MILESTONES) {
    if (Number(before.story_percent) < m && Number(after.story_percent) >= m) {
      events.push({
        kind: 'milestone',
        title: m === 100 ? 'Story durchgespielt! 🏁' : `${m} % der Story geschafft`,
        details: { story_percent: after.story_percent },
      })
    }
  }
  if (before.money < MILLION && after.money >= MILLION) {
    events.push({ kind: 'milestone', title: `Millionär! ${formatMoney(after.money)} auf dem Konto`, details: { money: after.money } })
  }
  const props = after.properties_owned - before.properties_owned
  if (props > 0) events.push({ kind: 'purchase', title: `${props === 1 ? 'Neue Immobilie' : `${props} neue Immobilien`} gekauft` })
  const cars = after.vehicles_owned - before.vehicles_owned
  if (cars > 0) events.push({ kind: 'purchase', title: `${cars === 1 ? 'Neues Fahrzeug' : `${cars} neue Fahrzeuge`} in der Garage` })
  const wasted = after.wasted_count - before.wasted_count
  if (wasted > 0) events.push({ kind: 'death', title: wasted === 1 ? 'Ist ins Gras gebissen 💀' : `${wasted}× ins Gras gebissen 💀` })
  const busted = after.busted_count - before.busted_count
  if (busted > 0) events.push({ kind: 'death', title: busted === 1 ? 'Wurde eingebuchtet 🚔' : `${busted}× eingebuchtet 🚔` })
  if (after.max_wanted_stars === 5 && before.max_wanted_stars < 5) {
    events.push({ kind: 'milestone', title: 'Volle 5 Fahndungssterne erreicht ⭐' })
  }
  return events
}

export function useMyProgress() {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session?.user.id
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true
    supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) toast.error(error, 'FORTSCHRITT NICHT GELADEN')
        setProgress(data)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, toast])

  /** Speichert Änderungen und legt passende Feed-Events an. Gibt die erzeugten Events zurück. */
  const save = useCallback(
    async (patch: ProgressUpdate): Promise<NewEvent[] | null> => {
      if (!userId || !progress) return null
      setSaving(true)
      try {
        const { data, error } = await supabase.from('progress').update(patch).eq('user_id', userId).select().single()
        if (error) {
          toast.error(error, 'SPEICHERN FEHLGESCHLAGEN')
          return null
        }
        const events = diffEvents(progress, data)
        setProgress(data)
        if (events.length) {
          const { error: evErr } = await supabase
            .from('progress_events')
            .insert(events.map((e) => ({ ...e, user_id: userId })))
          if (evErr) toast.error(evErr, 'FEED-EINTRAG FEHLGESCHLAGEN')
        }
        return events
      } finally {
        setSaving(false)
      }
    },
    [userId, progress, toast],
  )

  return { progress, loading, saving, save }
}
