export type CardStyle = 'x' | 'quote' | 'bare'
export type CardTheme = 'light' | 'dim' | 'dark'
export type Ratio = 'auto' | '1:1' | '4:5' | '9:16' | '16:9'
export type Padding = 's' | 'm' | 'l'
export type Resolution = 1 | 2 | 3

export interface Details {
  metrics: boolean
  timestamp: boolean
  media: boolean
  verified: boolean
}

export interface Settings {
  style: CardStyle
  theme: CardTheme
  background: string
  ratio: Ratio
  padding: Padding
  resolution: Resolution
  details: Details
  stamp: boolean
  safeZones: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  style: 'x',
  theme: 'light',
  background: 'spill',
  ratio: '4:5',
  padding: 'm',
  resolution: 2,
  details: { metrics: true, timestamp: true, media: true, verified: true },
  stamp: false,
  safeZones: true,
}

export interface Background {
  id: string
  label: string
  /** CSS background for the canvas. `spill` and `transparent` are drawn specially. */
  css: string
  /** Whether text laid directly on this ground should be dark. */
  light: boolean
}

export const BACKGROUNDS: Background[] = [
  { id: 'spill', label: 'Spill', css: '#14161a', light: false },
  { id: 'transparent', label: 'Transparent', css: 'transparent', light: true },
  { id: 'white', label: 'White', css: '#ffffff', light: true },
  { id: 'bone', label: 'Bone', css: '#e8e2d8', light: true },
  { id: 'sand', label: 'Sand', css: '#c7b9a6', light: true },
  { id: 'fog', label: 'Fog', css: '#5a6472', light: false },
  { id: 'void', label: 'Void', css: '#0a0a0a', light: false },
  { id: 'sky', label: 'Sky', css: '#1d9bf0', light: false },
  { id: 'ember', label: 'Ember', css: '#ff5a36', light: false },
  { id: 'acid', label: 'Acid', css: '#d7f25c', light: true },
  {
    id: 'tide',
    label: 'Tide',
    css: 'linear-gradient(160deg, #0f2a3d 0%, #2c5d6e 100%)',
    light: false,
  },
  {
    id: 'dawn',
    label: 'Dawn',
    css: 'linear-gradient(160deg, #ffb48a 0%, #e0607e 100%)',
    light: false,
  },
]

export function resolveBackground(id: string): Background {
  const preset = BACKGROUNDS.find((b) => b.id === id)
  if (preset) return preset
  if (/^#[0-9a-f]{6}$/i.test(id)) return { id, label: 'Custom', css: id, light: isLightHex(id) }
  return BACKGROUNDS[0]
}

export function isLightHex(hex: string): boolean {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const lum =
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  return lum > 0.4
}

export const RATIOS: { id: Ratio; label: string; size: [number, number] | null; hint: string }[] = [
  { id: 'auto', label: 'Auto', size: null, hint: 'Hugs the tweet' },
  { id: '1:1', label: '1:1', size: [1080, 1080], hint: 'Feed post' },
  { id: '4:5', label: '4:5', size: [1080, 1350], hint: 'Portrait post' },
  { id: '9:16', label: '9:16', size: [1080, 1920], hint: 'Story, Reel, TikTok' },
  { id: '16:9', label: '16:9', size: [1920, 1080], hint: 'Slides, video' },
]

/** Padding around the card. Auto canvases use design pixels; fixed canvases use a share of the width. */
export const PADDING_AUTO: Record<Padding, number> = { s: 32, m: 64, l: 112 }
export const PADDING_FIXED: Record<Padding, number> = { s: 0.06, m: 0.1, l: 0.15 }

/** Bands that story UIs (Instagram, TikTok) draw over a 9:16 frame. */
export const STORY_SAFE = { top: 0.13, bottom: 0.2 }

/** Natural width of every card style, in design pixels. */
export const CARD_WIDTH = 550
