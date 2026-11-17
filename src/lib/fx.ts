// Kleiner Event-Bus für Vollbild-Effekte (Konfetti, Geldregen, Blaulicht, Wackeln).
export type FxEvent =
  | { type: 'confetti'; amount?: number }
  | { type: 'money'; amount?: number }
  | { type: 'police' }
  | { type: 'shake' }

type Listener = (e: FxEvent) => void
const listeners = new Set<Listener>()

export const fx = {
  emit(e: FxEvent) {
    listeners.forEach((l) => l(e))
  },
  on(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
