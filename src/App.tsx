import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthProvider'
import { supabaseConfigured } from './lib/supabase'
import Background from './components/Background'
import Layout from './components/Layout'
import Login from './pages/Login'
import Crew from './pages/Crew'
import Leaderboard from './pages/Leaderboard'
import MyProgress from './pages/MyProgress'
import Feed from './pages/Feed'
import Achievements from './pages/Achievements'
import Profile from './pages/Profile'

function Splash({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <p className="font-display neon-pink animate-pulse text-3xl tracking-wider">{text}</p>
    </div>
  )
}

export default function App() {
  const { ready, session } = useAuth()

  return (
    <>
      <Background />
      {!supabaseConfigured ? (
        <Splash text="SUPABASE NICHT KONFIGURIERT – .env.local fehlt" />
      ) : !ready ? (
        <Splash text="LADE …" />
      ) : !session ? (
        <Login />
      ) : (
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Crew />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="me" element={<MyProgress />} />
              <Route path="feed" element={<Feed />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      )}
    </>
  )
}
