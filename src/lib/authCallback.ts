// Wird in main.tsx als ALLERERSTES importiert, damit wir die OAuth-Parameter
// lesen, bevor supabase-js oder der HashRouter die URL anfassen.

export interface AuthCallbackError {
  code: string
  description: string
  guestList: boolean
}

function readParams(): URLSearchParams {
  const merged = new URLSearchParams(window.location.search)
  const hash = window.location.hash.replace(/^#\/?/, '')
  // Hash kann "access_token=..." oder "error=..." enthalten
  if (hash.includes('=')) {
    new URLSearchParams(hash.split('?').pop()).forEach((v, k) => merged.set(k, v))
  }
  return merged
}

const params = readParams()

export const hadAuthParams = ['access_token', 'refresh_token', 'code', 'error', 'error_description', 'error_code'].some(
  (k) => params.has(k),
)

function detectError(): AuthCallbackError | null {
  const code = params.get('error')
  const description = params.get('error_description') ?? ''
  if (!code && !description) return null
  const text = `${code} ${params.get('error_code') ?? ''} ${description}`.toLowerCase()
  const guestList =
    text.includes('not_on_guest_list') ||
    text.includes('database error saving new user') ||
    text.includes('signups not allowed') ||
    text.includes('signup_disabled')
  return { code: code ?? 'error', description, guestList }
}

export const initialAuthError = detectError()

/** Entfernt Tokens/Fehler aus der URL und setzt den Hash auf die Startseite. */
export function cleanAuthUrl() {
  if (!hadAuthParams) return
  window.history.replaceState(null, '', window.location.pathname + '#/')
}
