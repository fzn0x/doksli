import { type Ref, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatCaptured, shortUrl } from '../lib/format'
import {
  CARD_WIDTH,
  PADDING_AUTO,
  PADDING_FIXED,
  RATIOS,
  resolveBackground,
  type Settings,
  STORY_SAFE,
} from '../lib/settings'
import type { Capture } from '../lib/storage'
import { QuoteCard } from './cards/QuoteCard'
import { XCard } from './cards/XCard'

interface TweetCanvasProps {
  capture: Capture
  settings: Settings
  spill: string | null
  /** The box the preview may occupy on screen, in CSS pixels. */
  avail: { width: number; height: number }
  canvasRef?: Ref<HTMLDivElement>
  onSize?: (size: CanvasGeometry) => void
}

export interface CanvasGeometry {
  width: number
  height: number
}

/** Size of the exported image at 1×, before resolution scaling. */
export function canvasSize(settings: Settings, groupHeight: number): CanvasGeometry {
  const ratio = RATIOS.find((r) => r.id === settings.ratio)
  if (ratio?.size) return { width: ratio.size[0], height: ratio.size[1] }
  const pad = PADDING_AUTO[settings.padding]
  return { width: CARD_WIDTH + pad * 2, height: Math.round(groupHeight + pad * 2) }
}

function useNaturalSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: CARD_WIDTH, height: 320 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const next = { width: el.offsetWidth, height: el.offsetHeight }
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

/**
 * The exported artifact. It is laid out at its real pixel size (1080×1350 for 4:5, and so
 * on) and scaled down on screen, so the preview and the PNG are the same layout.
 */
export function TweetCanvas({
  capture,
  settings,
  spill,
  avail,
  canvasRef,
  onSize,
}: TweetCanvasProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const natural = useNaturalSize(groupRef)
  const background = resolveBackground(settings.background)
  const size = canvasSize(settings, natural.height)

  useEffect(() => {
    onSize?.({ width: size.width, height: size.height })
  }, [onSize, size.width, size.height])
  const fixed = settings.ratio !== 'auto'
  const story = settings.ratio === '9:16'

  let padding: string
  let fit = 1
  if (fixed) {
    const pad = PADDING_FIXED[settings.padding] * size.width
    const top = story ? Math.max(pad, STORY_SAFE.top * size.height) : pad
    const bottom = story ? Math.max(pad, STORY_SAFE.bottom * size.height) : pad
    padding = `${top}px ${pad}px ${bottom}px`
    fit = Math.min(
      (size.width - pad * 2) / natural.width,
      (size.height - top - bottom) / natural.height,
    )
  } else {
    padding = `${PADDING_AUTO[settings.padding]}px`
  }

  const display = Math.min(avail.width / size.width, avail.height / size.height)
  const ink =
    background.id === 'transparent'
      ? settings.theme === 'light'
        ? 'dark'
        : 'light'
      : background.light
        ? 'dark'
        : 'light'
  const { tweet } = capture

  return (
    <div
      className="stage"
      data-transparent={background.id === 'transparent' || undefined}
      style={{ width: size.width * display, height: size.height * display }}
    >
      <div
        className="stage-scaler"
        style={{ width: size.width, height: size.height, transform: `scale(${display})` }}
      >
        <div
          ref={canvasRef}
          className="canvas"
          style={{
            width: size.width,
            height: size.height,
            padding,
            background: background.id === 'spill' ? '#14161a' : background.css,
          }}
        >
          {background.id === 'spill' && spill && (
            <>
              <img className="canvas-spill" src={spill} alt="" draggable={false} />
              <span className="canvas-shade" />
            </>
          )}
          <div
            ref={groupRef}
            className="canvas-group"
            style={fixed ? { transform: `scale(${fit})` } : undefined}
          >
            {settings.style === 'x' ? (
              <XCard tweet={tweet} theme={settings.theme} details={settings.details} />
            ) : (
              <QuoteCard
                tweet={tweet}
                theme={settings.theme}
                details={settings.details}
                bare={settings.style === 'bare'}
                ink={ink}
              />
            )}
            {settings.stamp && (
              <p className="stamp" data-ink={ink}>
                <span>{shortUrl(tweet.url)}</span>
                <span aria-hidden="true">·</span>
                <span>Captured {formatCaptured(capture.capturedAt)}</span>
              </p>
            )}
          </div>
        </div>
        {story && settings.safeZones && (
          <div className="safe-zones" data-preview-only aria-hidden="true">
            <span style={{ height: `${STORY_SAFE.top * 100}%` }}>Story header</span>
            <span style={{ height: `${STORY_SAFE.bottom * 100}%` }}>Reply bar</span>
          </div>
        )}
      </div>
    </div>
  )
}
