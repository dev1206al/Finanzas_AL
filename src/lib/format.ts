export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(y, m - 1, d))
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(y, m - 1, d))
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export interface CutPeriod {
  start: string   // YYYY-MM-DD
  end: string
  label: string   // e.g. "5 May — 4 Jun"
}

export function getPeriods(cutDay: number, count = 14): CutPeriod[] {
  const today = new Date()
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(d).replace('.', '')

  let sY = today.getFullYear()
  let sM = today.getMonth()
  if (today.getDate() < cutDay) {
    sM -= 1
    if (sM < 0) { sM = 11; sY -= 1 }
  }

  return Array.from({ length: count }, (_, i) => {
    let y = sY, m = sM - i
    while (m < 0) { m += 12; y -= 1 }

    const start = new Date(Date.UTC(y, m, cutDay))
    const nextCut = new Date(Date.UTC(y, m + 1, cutDay))
    const end = new Date(nextCut)
    end.setUTCDate(end.getUTCDate() - 1)

    const yearSuffix =
      start.getUTCFullYear() !== today.getFullYear() ||
      end.getUTCFullYear() !== today.getFullYear()
        ? ` ${end.getUTCFullYear()}`
        : ''

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `${fmt(start)} — ${fmt(end)}${yearSuffix}`,
    }
  })
}
