import { useEffect, useState, type FormEvent } from 'react'
import { useMyProgress } from '../hooks/useMyProgress'
import { useToast } from '../context/ToastProvider'
import type { Progress } from '../lib/database.types'
import PageTitle from '../components/PageTitle'
import WantedStars from '../components/WantedStars'
import ProgressBar from '../components/ProgressBar'
import { formatMoney } from '../lib/format'
import { fx } from '../lib/fx'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'

type Form = Omit<Progress, 'user_id' | 'updated_at'>

const numberFields: { key: keyof Form; label: string; step?: string; min?: number; max?: number }[] = [
  { key: 'story_percent', label: 'Story %', step: '0.1', min: 0, max: 100 },
  { key: 'completion_percent', label: 'Gesamt-Fortschritt %', step: '0.1', min: 0, max: 100 },
  { key: 'missions_done', label: 'Missionen', min: 0 },
  { key: 'money', label: 'Geld ($)', step: '1' },
  { key: 'playtime_hours', label: 'Spielzeit (h)', step: '0.1', min: 0 },
  { key: 'properties_owned', label: 'Immobilien', min: 0 },
  { key: 'vehicles_owned', label: 'Fahrzeuge', min: 0 },
  { key: 'wasted_count', label: 'Wasted', min: 0 },
  { key: 'busted_count', label: 'Busted', min: 0 },
]

function toForm(p: Progress): Form {
  const { user_id: _u, updated_at: _t, ...rest } = p
  void _u
  void _t
  return { ...rest, story_percent: Number(rest.story_percent), completion_percent: Number(rest.completion_percent), playtime_hours: Number(rest.playtime_hours), money: Number(rest.money) }
}

export default function MyProgress() {
  const { progress, loading, saving, save } = useMyProgress()
  const toast = useToast()
  const [form, setForm] = useState<Form | null>(null)

  useEffect(() => {
    if (progress) setForm(toForm(progress))
  }, [progress])

  if (loading || !form) return <p className="text-white/60">Lade deinen Stand …</p>

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))

  /** Extra-Effekte je nach Sprung: Geldregen, Konfetti, Blaulicht */
  const effects = (before: Progress, after: Partial<Form>) => {
    const moneyBefore = Number(before.money)
    const moneyAfter = after.money ?? moneyBefore
    const crossedMillion = moneyBefore < 1_000_000 && moneyAfter >= 1_000_000
    if (moneyAfter > moneyBefore) {
      window.setTimeout(() => sfx.cash(crossedMillion), 150)
      if (crossedMillion) fx.emit({ type: 'money', amount: 90 })
      else if (moneyAfter - moneyBefore >= 100_000) fx.emit({ type: 'money', amount: 25 })
    }
    const storyBefore = Number(before.story_percent)
    const storyAfter = after.story_percent ?? storyBefore
    if (storyBefore < 100 && storyAfter >= 100) fx.emit({ type: 'confetti', amount: 320 })
    else if ([25, 50, 75].some((m) => storyBefore < m && storyAfter >= m)) fx.emit({ type: 'confetti', amount: 140 })
    const starsBefore = before.max_wanted_stars
    const starsAfter = after.max_wanted_stars ?? starsBefore
    if (starsAfter > starsBefore) {
      sfx.siren(starsAfter === 5 ? 3 : 1)
      if (starsAfter === 5) {
        fx.emit({ type: 'police' })
        haptic.siren()
      }
    }
  }

  const celebrate = (events: { kind: string; title: string }[] | null, fallback: string) => {
    if (!events) return
    const death = events.find((e) => e.kind === 'death')
    const milestone = events.find((e) => e.kind === 'milestone')
    const mission = events.find((e) => e.kind === 'mission')
    if (death) toast.show('wasted', events.length > 1 ? 'AUTSCH.' : death.title.includes('eingebuchtet') ? 'EINGEBUCHTET' : 'ABGEKRATZT', death.title)
    else if (milestone) toast.show('passed', 'MEILENSTEIN!', milestone.title)
    else if (mission) toast.show('passed', 'JOB ERLEDIGT', mission.title)
    else toast.show('info', fallback)
  }

  const quick = async (key: 'missions_done' | 'wasted_count' | 'busted_count') => {
    haptic.tap()
    if (key === 'busted_count') sfx.siren(1)
    const events = await save({ [key]: (progress?.[key] ?? 0) + 1 })
    celebrate(events, 'GESPEICHERT')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.story_percent < 0 || form.story_percent > 100 || form.completion_percent < 0 || form.completion_percent > 100) {
      toast.show('error', 'UNGÜLTIG', 'Prozentwerte müssen zwischen 0 und 100 liegen.')
      return
    }
    const before = progress
    const events = await save({
      ...form,
      current_mission: form.current_mission?.trim() || null,
      status_message: form.status_message?.trim() || null,
    })
    celebrate(events, 'STAND GESPEICHERT')
    if (events && before) effects(before, form)
  }

  return (
    <section className="mx-auto max-w-2xl">
      <PageTitle sub="Beim Zocken schnell aktualisieren">Mein Fortschritt</PageTitle>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <button type="button" disabled={saving} onClick={() => quick('missions_done')} className="btn btn-teal py-4 text-base">
          +1 Mission
        </button>
        <button type="button" disabled={saving} onClick={() => quick('wasted_count')} className="btn btn-pink py-4 text-base">
          +1 Wasted
        </button>
        <button type="button" disabled={saving} onClick={() => quick('busted_count')} className="btn btn-ghost py-4 text-base">
          +1 Busted
        </button>
      </div>

      <form onSubmit={submit} className="glass shadow-teal space-y-5 p-5">
        <ProgressBar value={form.story_percent} label="Story" />

        <div>
          <span className="label">Höchstes Wanted-Level</span>
          <WantedStars size="lg" value={form.max_wanted_stars} onChange={(v) => set('max_wanted_stars', v)} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {numberFields.map((f) => (
            <label key={f.key}>
              <span className="label">{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                className="field"
                step={f.step ?? '1'}
                min={f.min}
                max={f.max}
                value={String(form[f.key] ?? 0)}
                onChange={(e) => set(f.key, (e.target.value === '' ? 0 : Number(e.target.value)) as never)}
              />
            </label>
          ))}
        </div>
        <p className="-mt-2 text-xs text-white/50">= {formatMoney(form.money)}</p>

        <label className="block">
          <span className="label">Aktuelle Mission</span>
          <input className="field" maxLength={120} value={form.current_mission ?? ''} onChange={(e) => set('current_mission', e.target.value)} />
        </label>

        <label className="block">
          <span className="label">Status ({(form.status_message ?? '').length}/140)</span>
          <textarea
            className="field resize-none"
            rows={2}
            maxLength={140}
            placeholder="z. B. Hänge gerade in den Keys ab"
            value={form.status_message ?? ''}
            onChange={(e) => set('status_message', e.target.value)}
          />
        </label>

        <button type="submit" disabled={saving} className="btn btn-pink w-full py-3 text-lg">
          {saving ? 'Speichere …' : 'Speichern'}
        </button>
      </form>
    </section>
  )
}
