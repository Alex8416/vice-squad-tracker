const moneyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

export const formatMoney = (n: number) => moneyFmt.format(Number(n) || 0)
export const formatNumber = (n: number) => numFmt.format(Number(n) || 0)
export const formatPercent = (n: number) => `${numFmt.format(Number(n) || 0)} %`
export const formatHours = (n: number) => `${numFmt.format(Number(n) || 0)} h`

const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '–'
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'gerade eben'
}

export function initials(name: string): string {
  return name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?'
}

export function errorMessage(e: unknown): string {
  if (!e) return 'Unbekannter Fehler'
  if (typeof e === 'string') return e
  if (typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Unbekannter Fehler'
}
