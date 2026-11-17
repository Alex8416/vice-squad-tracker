import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import Avatar from './Avatar'
import { NavLinks } from './Nav'
import SoundControls from './SoundControls'
import { NowPlaying, RadioButton, RadioWheel } from './Radio'
import { useRealtime } from '../hooks/useRealtime'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'

export default function Layout() {
  const { profile, session, signOut } = useAuth()
  const name = profile?.username ?? session?.user.email ?? '?'
  const location = useLocation()
  const [radioOpen, setRadioOpen] = useState(false)

  // Handy-Ping, wenn jemand anderes aus der Crew etwas ins Feed postet
  useRealtime('progress_events', (payload) => {
    if (payload.eventType === 'INSERT' && payload.new.user_id !== session?.user.id) {
      sfx.ping()
      haptic.tap()
    }
  })

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 border-b border-white/10 bg-night/70 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="font-display title-skew shrink-0 text-xl leading-[0.9] sm:text-2xl">
          <span className="sunset-text">VICE SQUAD</span> <br className="sm:hidden" />
          <span className="neon-pink neon-flicker">TRACKER</span>
        </Link>
        <nav className="ml-6 hidden gap-1 md:flex">
          <NavLinks variant="top" />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <RadioButton onOpen={() => setRadioOpen(true)} />
          <SoundControls />
          <Link to="/profile" aria-label="Profil">
            <Avatar name={name} color={profile?.avatar_color ?? '#ff2e88'} url={profile?.avatar_url} size={34} />
          </Link>
          <button type="button" onClick={signOut} aria-label="Logout" className="btn btn-ghost h-9 px-2.5 text-sm sm:px-3">
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden" aria-hidden>
              ⏻
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28 md:pb-10">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <RadioWheel open={radioOpen} onClose={() => setRadioOpen(false)} />
      <NowPlaying />

      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-white/10 bg-night/85 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  )
}
