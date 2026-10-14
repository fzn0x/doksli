import { DEFAULT_SETTINGS, type Settings } from './settings'
import type { Tweet } from './types'

export interface Capture {
  tweet: Tweet
  capturedAt: string
  example?: boolean
}

const CAPTURES_KEY = 'doksli:captures:v1'
const SETTINGS_KEY = 'doksli:settings:v1'
export const MAX_CAPTURES = 40

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the feed still works for this visit.
  }
}

export function loadCaptures(): Capture[] {
  const saved = read<Capture[]>(CAPTURES_KEY)
  return Array.isArray(saved) ? saved.filter((c) => c?.tweet?.id && !c.example) : []
}

export function saveCaptures(captures: Capture[]) {
  write(
    CAPTURES_KEY,
    captures.filter((c) => !c.example),
  )
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(SETTINGS_KEY)
  if (!saved) return DEFAULT_SETTINGS
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    details: { ...DEFAULT_SETTINGS.details, ...saved.details },
  }
}

export function saveSettings(settings: Settings) {
  write(SETTINGS_KEY, settings)
}
