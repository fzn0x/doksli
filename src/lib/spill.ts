import type { Tweet } from './types'

const SIZE = 32
const cache = new Map<string, Promise<string | null>>()

/** The picture whose colours spill behind a capture: its first image, else the author's avatar. */
export function spillSource(tweet: Tweet): string {
  const media = tweet.media[0] ?? tweet.quoted?.media[0]
  return media?.url ?? tweet.card?.image ?? tweet.author.avatar
}

function boxBlur(data: Uint8ClampedArray, radius: number) {
  const copy = new Uint8ClampedArray(data.length)
  const clamp = (v: number) => Math.min(SIZE - 1, Math.max(0, v))
  for (const horizontal of [true, false]) {
    copy.set(data)
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let r = 0
        let g = 0
        let b = 0
        for (let k = -radius; k <= radius; k++) {
          const sx = horizontal ? clamp(x + k) : x
          const sy = horizontal ? y : clamp(y + k)
          const i = (sy * SIZE + sx) * 4
          r += copy[i]
          g += copy[i + 1]
          b += copy[i + 2]
        }
        const n = radius * 2 + 1
        const o = (y * SIZE + x) * 4
        data[o] = r / n
        data[o + 1] = g / n
        data[o + 2] = b / n
        data[o + 3] = 255
      }
    }
  }
}

function saturate(data: Uint8ClampedArray, amount: number, dim: number) {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    for (let c = 0; c < 3; c++) {
      data[i + c] = (gray + (data[i + c] - gray) * amount) * dim
    }
  }
}

/**
 * Renders a tiny, blurred, saturated copy of an image as a data URL. Upscaled by the
 * browser it becomes the soft colour field feed apps put behind media that does not fill
 * the frame. Doing it in pixels (not CSS filters) keeps it identical in the exported PNG.
 */
export function makeSpill(src: string): Promise<string | null> {
  const cached = cache.get(src)
  if (cached) return cached
  const job = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        const side = Math.min(img.naturalWidth, img.naturalHeight)
        ctx.drawImage(
          img,
          (img.naturalWidth - side) / 2,
          (img.naturalHeight - side) / 2,
          side,
          side,
          0,
          0,
          SIZE,
          SIZE,
        )
        const pixels = ctx.getImageData(0, 0, SIZE, SIZE)
        boxBlur(pixels.data, 3)
        boxBlur(pixels.data, 2)
        saturate(pixels.data, 1.35, 0.78)
        ctx.putImageData(pixels, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
  cache.set(src, job)
  return job
}
