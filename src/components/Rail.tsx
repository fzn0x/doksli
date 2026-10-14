import {
  ArrowDownToLine,
  Copy,
  LayoutTemplate,
  LoaderCircle,
  PaintBucket,
  Proportions,
  Share,
  SlidersHorizontal,
  Stamp,
  SunMoon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { PanelId } from './Panel'

const ITEMS: {
  id: PanelId
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
}[] = [
  { id: 'style', label: 'Style', Icon: LayoutTemplate },
  { id: 'theme', label: 'Theme', Icon: SunMoon },
  { id: 'canvas', label: 'Canvas', Icon: PaintBucket },
  { id: 'ratio', label: 'Ratio', Icon: Proportions },
  { id: 'details', label: 'Details', Icon: SlidersHorizontal },
  { id: 'stamp', label: 'Stamp', Icon: Stamp },
]

export type RailAction = 'copy' | 'share' | 'download'

interface RailProps {
  openPanel: PanelId | null
  onToggle: (id: PanelId, anchor: HTMLElement) => void
  onAction: (action: RailAction) => void
  busy: RailAction | null
  secondary: 'copy' | 'share' | null
  output: string | null
  live: boolean
}

/** The feed's action rail: every setting stacked down one side, the export at its foot. */
export function Rail({ openPanel, onToggle, onAction, busy, secondary, output, live }: RailProps) {
  return (
    <nav className="rail" aria-label="Image options" inert={!live} data-live={live || undefined}>
      <ul className="rail-group">
        {ITEMS.map(({ id, label, Icon }) => {
          const engaged = openPanel === id
          return (
            <li key={id}>
              <button
                type="button"
                className="rail-button"
                data-panel={id}
                aria-expanded={engaged}
                aria-haspopup="dialog"
                onClick={(e) => onToggle(id, e.currentTarget)}
              >
                <span className="rail-glyph">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <span className="rail-label">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <ul className="rail-group rail-export">
        {secondary && (
          <li>
            <button
              type="button"
              className="rail-button"
              disabled={busy !== null}
              onClick={() => onAction(secondary)}
            >
              <span className="rail-glyph">
                {busy === secondary ? (
                  <LoaderCircle className="spin" size={22} strokeWidth={1.6} />
                ) : secondary === 'share' ? (
                  <Share size={22} strokeWidth={1.6} />
                ) : (
                  <Copy size={22} strokeWidth={1.6} />
                )}
              </span>
              <span className="rail-label">{secondary === 'share' ? 'Share' : 'Copy'}</span>
            </button>
          </li>
        )}
        <li>
          <button
            type="button"
            className="rail-button rail-primary"
            disabled={busy !== null}
            onClick={() => onAction('download')}
          >
            <span className="rail-glyph">
              {busy === 'download' ? (
                <LoaderCircle className="spin" size={24} strokeWidth={1.8} />
              ) : (
                <ArrowDownToLine size={24} strokeWidth={1.8} />
              )}
            </span>
            <span className="rail-label">Download</span>
            {output && <span className="rail-count">{output}</span>}
          </button>
        </li>
      </ul>
    </nav>
  )
}
