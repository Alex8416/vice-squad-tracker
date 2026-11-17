import { useSyncExternalStore } from 'react'

// Kleine Geräte-Einstellungen (pro Browser). Alle Zugriffe abgesichert, falls Storage blockiert ist.
export interface Prefs {
  sound: boolean
  /** Zuletzt gehörter Radiosender (null = Radio aus) */
  station: string | null
  /** Radio-Lautstärke 0–1 */
  volume: number
}

const KEY = 'vst-prefs'
const defaults: Prefs = { sound: true, station: null, volume: 0.8 }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Prefs>) } : defaults
  } catch {
    return defaults
  }
}

let state = load()
const listeners = new Set<() => void>()

export function getPrefs() {
  return state
}

export function setPrefs(patch: Partial<Prefs>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignorieren */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
