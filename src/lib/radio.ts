// Radio-Engine: ein <audio>-Element, Sender laufen „live“ (alle hören dieselbe Stelle).
import { useSyncExternalStore } from 'react'
import { STATIONS, trackUrl, type Station, type Track } from './radioStations'
import { getPrefs, setPrefs } from './prefs'
import { radioStatic, setMusicVolume, startMusic, stopMusic } from './sound'

export interface RadioState {
  station: Station | null
  track: Track | null
  playing: boolean
  loading: boolean
  error: string | null
  /** Zählt hoch bei jedem neuen Song → „Jetzt läuft“-Einblendung */
  announce: number
}

let state: RadioState = { station: null, track: null, playing: false, loading: false, error: null, announce: 0 }
const listeners = new Set<() => void>()
const set = (patch: Partial<RadioState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const getRadioState = () => state
/** Aktuelle Abspielposition in Sekunden (für Anzeigen/Tests). */
export const getRadioTime = () => el?.currentTime ?? 0

export const useRadio = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )

let el: HTMLAudioElement | null = null
let duckLevel = 1
let trackIndex = 0

function player() {
  if (!el) {
    el = new Audio()
    el.preload = 'none'
    el.addEventListener('ended', () => {
      const st = state.station
      if (st && !st.synth) playIndex(st, (trackIndex + 1) % st.tracks.length, 0)
    })
    el.addEventListener('playing', () => set({ playing: true, loading: false, error: null }))
    el.addEventListener('waiting', () => set({ loading: true }))
    // Beim Wechsel auf den Synth-Sender wird der MP3-Player pausiert, das soll den Status nicht überschreiben
    el.addEventListener('pause', () => {
      if (!state.station?.synth) set({ playing: false })
    })
    el.addEventListener('error', () => set({ playing: false, loading: false, error: 'Sender nicht erreichbar' }))
  }
  return el
}

function applyVolume() {
  const v = getPrefs().volume * duckLevel
  try {
    if (el) el.volume = Math.max(0, Math.min(1, v))
  } catch {
    /* iOS: Lautstärke nur über Gerätetasten */
  }
  setMusicVolume(v)
}

/** Live-Position: Jeder Sender hat eine feste „Sendeuhr“, damit die ganze Crew dasselbe hört. */
function livePosition(st: Station) {
  const total = st.tracks.reduce((s, x) => s + x.duration, 0)
  const salt = [...st.id].reduce((s, c) => s + c.charCodeAt(0) * 97, 0)
  let pos = (Date.now() / 1000 + salt) % total
  for (let i = 0; i < st.tracks.length; i++) {
    const d = st.tracks[i]!.duration
    if (pos < d) return { index: i, offset: pos }
    pos -= d
  }
  return { index: 0, offset: 0 }
}

function playIndex(st: Station, index: number, offset: number) {
  const a = player()
  trackIndex = index
  const track = st.tracks[index]!
  set({ station: st, track, loading: true, error: null, announce: state.announce + 1 })
  a.src = trackUrl(track.file)
  a.preload = 'auto'
  if (offset > 1) {
    a.addEventListener(
      'loadedmetadata',
      () => {
        try {
          a.currentTime = Math.min(offset, (a.duration || track.duration) - 2)
        } catch {
          /* ignorieren */
        }
      },
      { once: true },
    )
  }
  applyVolume()
  a.play().catch((e: unknown) => {
    set({ playing: false, loading: false, error: e instanceof Error && e.name === 'NotAllowedError' ? null : 'Wiedergabe fehlgeschlagen' })
  })
  updateMediaSession(st, track)
}

function updateMediaSession(st: Station, track: Track) {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: `${st.name} ${st.freq} · ${st.genre}`,
      album: 'Vice Squad Radio',
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => nextStation(1))
    navigator.mediaSession.setActionHandler('previoustrack', () => nextStation(-1))
    navigator.mediaSession.setActionHandler('pause', () => tune(null))
    navigator.mediaSession.setActionHandler('play', () => tune(getPrefs().station))
  } catch {
    /* ältere Browser */
  }
}

/** Sender einstellen (null = Radio aus). */
export function tune(id: string | null, { quiet = false } = {}) {
  if (!quiet) radioStatic()
  const st = STATIONS.find((s) => s.id === id) ?? null
  setPrefs({ station: st?.id ?? null })

  if (!st) {
    el?.pause()
    stopMusic()
    set({ station: null, track: null, playing: false, loading: false, error: null })
    return
  }
  if (st.synth) {
    el?.pause()
    applyVolume()
    startMusic()
    set({ station: st, track: st.tracks[0]!, playing: true, loading: false, error: null, announce: state.announce + 1 })
    updateMediaSession(st, st.tracks[0]!)
    return
  }
  stopMusic()
  el?.pause()
  const { index, offset } = livePosition(st)
  // Kurz rauschen lassen, dann einblenden
  window.setTimeout(() => playIndex(st, index, offset), quiet ? 0 : 250)
}

export function nextStation(dir: 1 | -1) {
  const i = STATIONS.findIndex((s) => s.id === state.station?.id)
  const next = STATIONS[(i + dir + STATIONS.length) % STATIONS.length]!
  tune(next.id)
}

export function setVolume(v: number) {
  setPrefs({ volume: v })
  applyVolume()
}

/** Radio kurz leiser machen, z. B. während Erfolgs- oder Wasted-Sound. */
let duckTimer: number | undefined
export function duck(ms = 2800) {
  if (!state.station) return
  duckLevel = 0.25
  applyVolume()
  window.clearTimeout(duckTimer)
  duckTimer = window.setTimeout(() => {
    duckLevel = 1
    applyVolume()
  }, ms)
}
