import { useEffect, useState } from 'react'
import { STATIONS, type Station } from '../lib/radioStations'
import { nextStation, setVolume, tune, useRadio } from '../lib/radio'
import { usePrefs } from '../lib/prefs'

/** Kleine Equalizer-Balken, animiert solange Musik läuft. */
function Eq({ on, color = '#00e5d4' }: { on: boolean; color?: string }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm ${on ? 'eq-bar' : ''}`}
          style={{ background: color, height: on ? undefined : 3, animationDelay: `${i * -0.23}s` }}
        />
      ))}
    </span>
  )
}

function StationLogo({ station, size = 64, active = false }: { station: Station | null; size?: number; active?: boolean }) {
  if (!station) {
    return (
      <span
        className="font-display grid place-items-center rounded-full border-2 border-white/30 bg-night/80 text-white/70"
        style={{ width: size, height: size, fontSize: size * 0.24 }}
      >
        AUS
      </span>
    )
  }
  return (
    <span
      className="font-display grid place-items-center rounded-full border-2 bg-night/85 leading-none"
      style={{
        width: size,
        height: size,
        borderColor: station.color,
        boxShadow: active ? `0 0 22px ${station.color}, inset 0 0 14px ${station.color}66` : `0 0 8px ${station.color}55`,
      }}
    >
      <span className="text-center">
        <span className="block" style={{ color: station.color, fontSize: size * (station.name.length > 6 ? 0.16 : 0.22) }}>
          {station.name}
        </span>
        <span className="block text-white/85" style={{ fontSize: size * 0.19 }}>
          {station.freq}
        </span>
      </span>
    </span>
  )
}

/** Knopf in der Kopfzeile, öffnet das Radio-Rad. */
export function RadioButton({ onOpen }: { onOpen: () => void }) {
  const radio = useRadio()
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Radio öffnen"
      title={radio.station ? `${radio.station.name} ${radio.station.freq}` : 'Radio'}
      className={`btn h-9 gap-1.5 px-2.5 text-base ${radio.station ? 'btn-ghost border-teal/50' : 'btn-ghost'}`}
    >
      <span aria-hidden>📻</span>
      {radio.station && <Eq on={radio.playing} color={radio.station.color} />}
    </button>
  )
}

/** Radio-Rad: Sender im Kreis, Mitte zeigt Sender, Song und Lautstärke. */
export function RadioWheel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const radio = useRadio()
  const { volume } = usePrefs()
  const [hover, setHover] = useState<Station | null | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') nextStation(1)
      if (e.key === 'ArrowLeft') nextStation(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const items: (Station | null)[] = [...STATIONS, null]
  const shown = hover !== undefined ? hover : radio.station
  const R = 128

  return (
    <div className="wheel-backdrop fixed inset-0 z-[70] flex flex-col items-center justify-center bg-night/75 backdrop-blur-md" onClick={onClose}>
      <div role="dialog" aria-label="Radio" className="wheel-in relative h-[330px] w-[330px]" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-[38px] rounded-full border border-white/10 bg-[radial-gradient(circle,#1a0b3dcc,#0b0420ee)] shadow-[0_0_40px_#ff2e8833]" />
        <div className="wheel-ring absolute inset-[26px] rounded-full border border-dashed border-white/15" />

        {items.map((st, i) => {
          const angle = -90 + (i * 360) / items.length
          const x = Math.cos((angle * Math.PI) / 180) * R
          const y = Math.sin((angle * Math.PI) / 180) * R
          const active = (st?.id ?? null) === (radio.station?.id ?? null)
          return (
            <button
              key={st?.id ?? 'off'}
              type="button"
              aria-label={st ? `${st.name} ${st.freq}, ${st.genre}` : 'Radio aus'}
              aria-pressed={active}
              data-no-click-sound
              onClick={() => tune(st?.id ?? null)}
              onMouseEnter={() => setHover(st)}
              onMouseLeave={() => setHover(undefined)}
              onFocus={() => setHover(st)}
              onBlur={() => setHover(undefined)}
              className={`wheel-item absolute top-1/2 left-1/2 transition-transform duration-200 ${active ? 'scale-115' : 'hover:scale-110'}`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, animationDelay: `${i * 50}ms` }}
            >
              <StationLogo station={st} size={66} active={active} />
            </button>
          )
        })}

        <div className="pointer-events-none absolute inset-[90px] flex flex-col items-center justify-center text-center">
          {shown ? (
            <>
              <p className="font-display text-2xl leading-none" style={{ color: shown.color, textShadow: `0 0 12px ${shown.color}` }}>
                {shown.name} {shown.freq}
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-white/60 uppercase">{shown.genre}</p>
              {radio.station?.id === shown.id && radio.track && (
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-white">
                  {radio.loading ? 'Empfang …' : radio.track.title}
                </p>
              )}
            </>
          ) : (
            <p className="font-display text-2xl text-white/70">RADIO AUS</p>
          )}
          {radio.error && <p className="mt-1 text-[11px] text-pink">{radio.error}</p>}
        </div>
      </div>

      <div className="mt-[-12px] flex w-[280px] items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <span aria-hidden>🔈</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Radio-Lautstärke"
          className="w-full accent-[#ff2e88]"
        />
        <span aria-hidden>🔊</span>
      </div>
      <p className="mt-3 px-6 text-center text-xs text-white/50">Tippe auf einen Sender · daneben tippen zum Schließen</p>
    </div>
  )
}

/** „Jetzt läuft“-Einblendung bei jedem neuen Song, wie im Spiel unten links. */
export function NowPlaying() {
  const radio = useRadio()
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!radio.announce || !radio.station) return
    setVisible(radio.announce)
    const t = window.setTimeout(() => setVisible(0), 5000)
    return () => window.clearTimeout(t)
  }, [radio.announce, radio.station])

  if (!visible || !radio.station || !radio.track) return null
  const st = radio.station
  return (
    <div
      key={visible}
      role="status"
      className="now-playing pointer-events-none fixed bottom-24 left-4 z-40 flex max-w-[80vw] items-center gap-3 rounded-xl border border-white/15 bg-night/85 p-2.5 pr-4 backdrop-blur-md md:bottom-6"
      style={{ boxShadow: `4px 4px 0 ${st.color}` }}
    >
      <StationLogo station={st} size={46} active />
      <div className="min-w-0">
        <p className="font-display truncate text-sm" style={{ color: st.color }}>
          {st.name} {st.freq}
        </p>
        <p className="truncate text-sm font-semibold text-white">{radio.track.title}</p>
      </div>
      <Eq on={radio.playing} color={st.color} />
    </div>
  )
}
