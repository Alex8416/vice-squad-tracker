import { useMemo } from 'react'

const TIPS = [
  'Tipp: Mit „+1 Mission“ trägst du Fortschritt direkt vom Sofa aus ein.',
  'Tipp: Wer zuerst die Story durch hat, darf den Abend-Snack aussuchen.',
  'Tipp: Fünf Sterne sind kein Achievement für deinen Fahrstil. Okay, doch.',
  'Tipp: Dein Status-Text ist für die ganze Crew sichtbar. Wähle weise.',
  'Tipp: Achievements bringen Punkte fürs Leaderboard.',
  'Tipp: Die Karten aktualisieren sich live, du musst nicht neu laden.',
]

/** Ladebildschirm im Stil eines Spiel-Loadscreens (eigene Grafik und Texte). */
export default function LoadingScreen({ text = 'LADE' }: { text?: string }) {
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], [])
  return (
    <div className="flex min-h-dvh flex-col items-center justify-end px-6 pb-[14vh] text-center">
      <p className="font-display title-skew anim-title-drop text-5xl">
        <span className="sunset-text">VICE SQUAD</span> <span className="neon-pink neon-flicker">TRACKER</span>
      </p>
      <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-white/15">
        <div className="load-bar h-full w-1/3 rounded-full bg-gradient-to-r from-pink via-sunset to-sun shadow-[0_0_12px_#ff2e88]" />
      </div>
      <p className="font-display mt-4 animate-pulse text-sm tracking-[0.4em] text-white/80">{text} …</p>
      <p className="anim-fade-up mt-6 max-w-xs text-sm text-white/70" style={{ animationDelay: '0.6s' }}>
        {tip}
      </p>
    </div>
  )
}
