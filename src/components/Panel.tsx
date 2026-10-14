import { X } from 'lucide-react'
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BACKGROUNDS,
  type CardStyle,
  type CardTheme,
  type Details,
  type Padding,
  RATIOS,
  type Ratio,
  type Resolution,
  type Settings,
} from '../lib/settings'
import { Field, OptionList, Segmented, SwatchGrid, Switch } from './controls'

export type PanelId = 'style' | 'theme' | 'canvas' | 'ratio' | 'details' | 'stamp'

export const PANEL_TITLES: Record<PanelId, string> = {
  style: 'Style',
  theme: 'Theme',
  canvas: 'Canvas',
  ratio: 'Ratio',
  details: 'Details',
  stamp: 'Stamp',
}

interface PanelProps {
  id: PanelId
  settings: Settings
  update: (patch: Partial<Settings>) => void
  spill: string | null
  output: { width: number; height: number } | null
  mobile: boolean
  anchor: HTMLElement | null
  onClose: () => void
}

function ThemeChip({ theme }: { theme: CardTheme }) {
  return <span className="theme-chip" data-card-theme={theme} aria-hidden="true" />
}

function RatioGlyph({ ratio }: { ratio: Ratio }) {
  const size = RATIOS.find((r) => r.id === ratio)?.size
  const [w, h] = size
    ? size[0] > size[1]
      ? [18, 10]
      : [Math.round((18 * size[0]) / size[1]), 18]
    : [14, 14]
  return (
    <span
      className="ratio-glyph"
      data-auto={ratio === 'auto' || undefined}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  )
}

function PanelBody({
  id,
  settings,
  update,
  spill,
  output,
}: Omit<PanelProps, 'mobile' | 'anchor' | 'onClose'>) {
  const setDetail = (key: keyof Details) => (value: boolean) =>
    update({ details: { ...settings.details, [key]: value } })

  switch (id) {
    case 'style':
      return (
        <OptionList<CardStyle>
          label="Card style"
          value={settings.style}
          onChange={(style) => update({ style })}
          options={[
            { value: 'x', label: 'X', description: 'Faithful to x.com. Reads as a screenshot.' },
            {
              value: 'quote',
              label: 'Quote',
              description: 'Large type on a card, for slides and posts.',
            },
            { value: 'bare', label: 'Bare', description: 'No card. The words sit on the canvas.' },
          ]}
        />
      )
    case 'theme':
      return (
        <>
          <Segmented<CardTheme>
            label="Card theme"
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            options={[
              {
                value: 'light',
                label: (
                  <>
                    <ThemeChip theme="light" />
                    Light
                  </>
                ),
              },
              {
                value: 'dim',
                label: (
                  <>
                    <ThemeChip theme="dim" />
                    Dim
                  </>
                ),
              },
              {
                value: 'dark',
                label: (
                  <>
                    <ThemeChip theme="dark" />
                    Dark
                  </>
                ),
              },
            ]}
          />
          <p className="panel-note">
            {settings.style === 'bare'
              ? 'Bare text takes its colour from the canvas. Theme applies on a transparent canvas.'
              : 'The same three themes X offers.'}
          </p>
        </>
      )
    case 'canvas':
      return (
        <>
          <Field label="Background">
            <SwatchGrid
              label="Background"
              value={settings.background}
              onChange={(background) => update({ background })}
              swatches={BACKGROUNDS.map((b) => ({
                id: b.id,
                label: b.id === 'spill' ? 'Spill: colours from the tweet' : b.label,
                css: b.css,
                image: b.id === 'spill' ? spill : undefined,
              }))}
            />
          </Field>
          <Field label="Padding">
            <Segmented<Padding>
              label="Padding"
              value={settings.padding}
              onChange={(padding) => update({ padding })}
              options={[
                { value: 's', label: 'Tight' },
                { value: 'm', label: 'Even' },
                { value: 'l', label: 'Airy' },
              ]}
            />
          </Field>
        </>
      )
    case 'ratio':
      return (
        <>
          <OptionList<Ratio>
            label="Aspect ratio"
            value={settings.ratio}
            onChange={(ratio) => update({ ratio })}
            options={RATIOS.map((r) => ({
              value: r.id,
              label: (
                <>
                  <RatioGlyph ratio={r.id} />
                  {r.label}
                </>
              ),
              description: r.hint,
            }))}
          />
          {settings.ratio === '9:16' && (
            <Switch
              label="Show story overlays"
              description="Marks where Instagram and TikTok draw their own UI."
              checked={settings.safeZones}
              onChange={(safeZones) => update({ safeZones })}
            />
          )}
          <Field label="Resolution">
            <Segmented<Resolution>
              label="Resolution"
              value={settings.resolution}
              onChange={(resolution) => update({ resolution })}
              options={[
                { value: 1, label: '1×' },
                { value: 2, label: '2×' },
                { value: 3, label: '3×' },
              ]}
            />
          </Field>
          {output && (
            <p className="panel-note tabular">
              PNG, {output.width * settings.resolution} × {output.height * settings.resolution} px
            </p>
          )}
        </>
      )
    case 'details':
      return (
        <>
          <Switch
            label="Metrics"
            description="Reply and like counts"
            checked={settings.details.metrics}
            onChange={setDetail('metrics')}
          />
          <Switch
            label="Timestamp"
            description="When it was posted"
            checked={settings.details.timestamp}
            onChange={setDetail('timestamp')}
          />
          <Switch
            label="Media"
            description="Photos, video stills, link previews"
            checked={settings.details.media}
            onChange={setDetail('media')}
          />
          <Switch
            label="Verified badge"
            description="As X shows it"
            checked={settings.details.verified}
            onChange={setDetail('verified')}
          />
        </>
      )
    case 'stamp':
      return (
        <>
          <Switch
            label="Receipt stamp"
            description="Adds the tweet's link and the time you captured it, under the tweet."
            checked={settings.stamp}
            onChange={(stamp) => update({ stamp })}
          />
          <p className="panel-note">
            Useful as proof if the tweet is later edited or deleted. doksli never changes the tweet
            itself.
          </p>
        </>
      )
  }
}

/** Popover beside the rail on desktop, bottom sheet on phones. */
export function Panel(props: PanelProps) {
  const { id, mobile, anchor, onClose } = props
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (mobile || !anchor || !ref.current) return
    const place = () => {
      const panel = ref.current
      if (!panel) return
      const a = anchor.getBoundingClientRect()
      const h = panel.offsetHeight
      const top = Math.min(window.innerHeight - h - 20, Math.max(20, a.bottom - h + 6))
      setPosition({ left: a.right + 16, top })
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(ref.current)
    window.addEventListener('resize', place)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [mobile, anchor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        anchor?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, anchor])

  const content: ReactNode = (
    <div
      ref={ref}
      className={mobile ? 'panel panel-sheet' : 'panel'}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`panel-${id}`}
      style={!mobile && position ? { left: position.left, top: position.top } : undefined}
      data-placed={mobile || position ? true : undefined}
    >
      <header className="panel-head">
        <h2 id={`panel-${id}`}>{PANEL_TITLES[id]}</h2>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div className="panel-body">
        <PanelBody {...props} />
      </div>
    </div>
  )

  if (!mobile) return content
  return (
    <>
      <button type="button" className="sheet-scrim" aria-label="Close panel" onClick={onClose} />
      {content}
    </>
  )
}
