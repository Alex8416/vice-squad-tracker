import { useEffect } from 'react'
import { setPrefs, usePrefs } from '../lib/prefs'
import { sfx, startMusic, stopMusic, unlockAudioOnFirstGesture } from '../lib/sound'

/** Globale Sound-Logik: Audio entsperren, Klick-Sounds, Musik an/aus. Einmal in der App einhängen. */
export function SoundManager() {
  const { music } = usePrefs()

  useEffect(() => {
    unlockAudioOnFirstGesture()
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('button, a')
      if (el && !el.hasAttribute('data-no-click-sound')) sfx.click()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // Musik startet erst nach einer Geste (Autoplay-Regeln der Browser)
  useEffect(() => {
    if (!music) {
      stopMusic()
      return
    }
    const start = () => startMusic()
    if (navigator.userActivation?.hasBeenActive) start()
    else {
      window.addEventListener('pointerdown', start, { once: true })
      return () => window.removeEventListener('pointerdown', start)
    }
    return () => stopMusic()
  }, [music])

  return null
}

/** Schalter für Soundeffekte und Hintergrundmusik. */
export default function SoundControls() {
  const { sound, music } = usePrefs()
  return (
    <div className="flex items-center gap-1">
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
      <button
        type="button"
        data-no-click-sound
        onClick={() => setPrefs({ music: !music })}
        aria-pressed={music}
        aria-label={music ? 'Musik aus' : 'Musik an'}
        title={music ? 'Musik aus' : 'Synthwave-Musik an'}
        className={`btn h-9 w-9 p-0 text-base ${music ? 'btn-teal' : 'btn-ghost opacity-60'}`}
      >
        🎵
      </button>
    </div>
  )
}
