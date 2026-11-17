import { useEffect } from 'react'
import { getPrefs, setPrefs, usePrefs } from '../lib/prefs'
import { sfx, unlockAudioOnFirstGesture } from '../lib/sound'
import { tune } from '../lib/radio'

/** Globale Sound-Logik: Audio entsperren, Klick-Sounds, zuletzt gehörten Sender fortsetzen. */
export function SoundManager() {
  useEffect(() => {
    unlockAudioOnFirstGesture()
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('button, a')
      if (el && !el.hasAttribute('data-no-click-sound')) sfx.click()
    }
    document.addEventListener('click', onClick, true)

    // Wie im Auto: Der zuletzt gehörte Sender läuft beim ersten Antippen weiter (Autoplay-Regeln der Browser)
    const resume = () => {
      const st = getPrefs().station
      if (st) tune(st, { quiet: true })
    }
    if (getPrefs().station) window.addEventListener('pointerdown', resume, { once: true })

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('pointerdown', resume)
    }
  }, [])

  return null
}

/** Schalter für Soundeffekte. */
export default function SoundControls() {
  const { sound } = usePrefs()
  return (
    <button
      type="button"
      data-no-click-sound
      onClick={() => setPrefs({ sound: !sound })}
      aria-pressed={sound}
      aria-label={sound ? 'Soundeffekte aus' : 'Soundeffekte an'}
      title={sound ? 'Soundeffekte aus' : 'Soundeffekte an'}
      className={`btn btn-ghost h-9 w-9 p-0 text-base ${sound ? '' : 'opacity-50'}`}
    >
      {sound ? '🔊' : '🔇'}
    </button>
  )
}
