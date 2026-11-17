import { useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import GoogleIcon from '../components/GoogleIcon'

export default function Login() {
  const { signInWithGoogle, authError, clearAuthError } = useAuth()
  const [busy, setBusy] = useState(false)

  const login = async () => {
    setBusy(true)
    await signInWithGoogle()
    setBusy(false)
  }

  if (authError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="glass shadow-pink anim-fade-up w-full max-w-md p-8">
          <p className="font-display title-skew anim-title-drop text-6xl text-[#ff3b3b] [text-shadow:0_0_18px_#ff2e88]">
            {authError.guestList ? 'ACCESS DENIED' : 'LOGIN FEHLGESCHLAGEN'}
          </p>
          {authError.guestList ? (
            <>
              <p className="mt-6 text-lg font-semibold">Du stehst nicht auf der Gästeliste.</p>
              <p className="mt-2 text-white/75">
                Der Türsteher lässt dich nicht rein. Melde dich bei <strong className="text-sun">Alex</strong>, damit er
                deine Gmail-Adresse freischaltet.
              </p>
            </>
          ) : (
            <p className="mt-6 text-white/75">{authError.description || authError.code}</p>
          )}
          <button type="button" className="btn btn-ghost mt-8 w-full" onClick={clearAuthError}>
            Zurück zum Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between px-4 pt-[14vh] pb-[12vh] text-center">
      <div>
        <p className="font-display neon-teal anim-fade-up text-lg tracking-[0.4em]" style={{ animationDelay: '0.9s' }}>
          Leonida Crew Network
        </p>
        <h1 className="font-display title-skew anim-title-drop mt-2 text-7xl leading-[0.85] sm:text-8xl" style={{ animationDelay: '0.3s' }}>
          <span className="sunset-text block">VICE SQUAD</span>
          <span className="neon-pink neon-flicker block">TRACKER</span>
        </h1>
        <p className="anim-fade-up mx-auto mt-6 max-w-xs text-white/80" style={{ animationDelay: '1.1s' }}>
          Story, Kohle, Wanted-Level: Wer aus der Crew ist vorne?
        </p>
      </div>
      <button
        type="button"
        onClick={login}
        disabled={busy}
        className="btn btn-pink anim-fade-up px-6 py-4 text-lg"
        style={{ animationDelay: '1.4s' }}
      >
        <span className="grid place-items-center rounded-full bg-white p-1">
          <GoogleIcon />
        </span>
        {busy ? 'Weiterleitung …' : 'Mit Google einloggen'}
      </button>
    </main>
  )
}
