import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthProvider'
import { useToast } from '../context/ToastProvider'
import Avatar from '../components/Avatar'
import PageTitle from '../components/PageTitle'

const PALETTE = ['#ff2e88', '#ff8a3d', '#ffd23f', '#00e5d4', '#7dffb0', '#4da3ff', '#b46bff', '#ff5c5c', '#f5ecff']

export default function Profile() {
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [color, setColor] = useState(PALETTE[0]!)
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setColor(profile.avatar_color)
    setRole(profile.crew_role ?? '')
  }, [profile])

  if (!profile) return <p className="text-white/60">Lade Profil …</p>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (name.length < 2 || name.length > 24) {
      toast.show('error', 'UNGÜLTIG', 'Der Username muss 2–24 Zeichen lang sein.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: name, avatar_color: color, crew_role: role.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      if (error.code === '23505') toast.show('error', 'NAME VERGEBEN', 'Den Username hat schon jemand aus der Crew.')
      else toast.error(error, 'SPEICHERN FEHLGESCHLAGEN')
      return
    }
    await refreshProfile()
    toast.show('passed', 'NEUE IDENTITÄT', 'Profil gespeichert.')
  }

  return (
    <section className="mx-auto max-w-lg">
      <PageTitle sub={session?.user.email}>Profil</PageTitle>
      <form onSubmit={submit} className="glass shadow-pink space-y-6 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={username || '?'} color={color} url={profile.avatar_url} size={72} />
          <div>
            <p className="font-display text-3xl" style={{ color }}>
              {username || '…'}
            </p>
            <p className="text-sm text-teal">{role || 'Rookie'}</p>
          </div>
        </div>

        <label className="block">
          <span className="label">Username</span>
          <input className="field" minLength={2} maxLength={24} required value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <div>
          <span className="label">Avatar-Farbe</span>
          <div className="flex flex-wrap gap-3">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Farbe ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`h-10 w-10 rounded-full border-2 transition ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                style={{ background: c, boxShadow: color === c ? `0 0 14px ${c}` : undefined }}
              />
            ))}
          </div>
          {profile.avatar_url && <p className="mt-2 text-xs text-white/50">Dein Google-Bild wird angezeigt, die Farbe ist Rahmen und Fallback.</p>}
        </div>

        <label className="block">
          <span className="label">Crew-Rolle</span>
          <input className="field" maxLength={40} placeholder="z. B. Fahrer, Hacker, Muskel" value={role} onChange={(e) => setRole(e.target.value)} />
        </label>

        <button type="submit" disabled={saving} className="btn btn-pink w-full py-3 text-lg">
          {saving ? 'Speichere …' : 'Speichern'}
        </button>
      </form>
    </section>
  )
}
