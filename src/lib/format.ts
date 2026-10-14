const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function formatCount(n: number): string {
  return n < 10_000 ? n.toLocaleString('en') : compact.format(n)
}

/** X's focal-tweet stamp: "8:50 PM · Mar 21, 2006". */
export function formatPosted(iso: string): { time: string; date: string } {
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** "Oct 14, 2026, 4:47 PM GMT+7" for the receipt stamp. */
export function formatCaptured(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/** "Captured 4:47 PM" today, "Captured Oct 12" otherwise. */
export function formatCapturedShort(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return formatShortDate(iso)
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '')
}
