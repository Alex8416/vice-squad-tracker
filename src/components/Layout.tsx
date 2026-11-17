import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import Avatar from './Avatar'
import { NavLinks } from './Nav'

export default function Layout() {
  const { profile, session, signOut } = useAuth()
  const name = profile?.username ?? session?.user.email ?? '?'
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-night/70 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="font-display title-skew text-2xl leading-none">
          <span className="sunset-text">VICE SQUAD</span> <span className="neon-pink neon-flicker">TRACKER</span>
        </Link>
        <nav className="ml-6 hidden gap-1 md:flex">
          <NavLinks variant="top" />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/profile" aria-label="Profil">
            <Avatar name={name} color={profile?.avatar_color ?? '#ff2e88'} url={profile?.avatar_url} size={34} />
          </Link>
          <button type="button" onClick={signOut} className="btn btn-ghost px-3 py-1.5 text-sm">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28 md:pb-10">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-white/10 bg-night/85 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  )
}
