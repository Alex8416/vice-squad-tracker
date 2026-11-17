// Vibration (Android/Chrome). iOS-Safari unterstützt das nicht und ignoriert es still.
export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignorieren */
  }
}

export const haptic = {
  tap: () => vibrate(12),
  success: () => vibrate([30, 40, 60]),
  wasted: () => vibrate([120, 60, 200]),
  siren: () => vibrate([60, 60, 60, 60, 60]),
}
