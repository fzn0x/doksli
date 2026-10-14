import { Play } from 'lucide-react'
import { useId } from 'react'
import { formatDuration } from '../../lib/format'
import type { TextSegment, TweetAuthor, TweetLinkCard, TweetMedia } from '../../lib/types'

const BADGE_PATH =
  'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z'

/** X's verification mark, coloured by kind the way X colours it. */
export function VerifiedBadge({ author, size = 18 }: { author: TweetAuthor; size?: number }) {
  const gradientId = useId()
  if (!author.verified) return null
  const label =
    author.verified === 'business'
      ? 'Verified organization'
      : author.verified === 'government'
        ? 'Verified government account'
        : 'Verified account'
  return (
    <svg
      className={`badge badge-${author.verified}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      {author.verified === 'business' && (
        <defs>
          <linearGradient id={gradientId} x1="4" y1="1.5" x2="19.5" y2="22">
            <stop offset="0" stopColor="#f4e72a" />
            <stop offset=".54" stopColor="#cd8105" />
            <stop offset=".69" stopColor="#cb7b00" />
            <stop offset="1" stopColor="#f4ec26" />
          </linearGradient>
        </defs>
      )}
      <path
        d={BADGE_PATH}
        fill={author.verified === 'business' ? `url(#${gradientId})` : undefined}
      />
    </svg>
  )
}

export function Avatar({ author, size }: { author: TweetAuthor; size: number }) {
  return (
    <img
      className={`avatar avatar-${author.shape}`}
      src={author.avatar}
      alt=""
      width={size}
      height={size}
      crossOrigin="anonymous"
      draggable={false}
    />
  )
}

export function Affiliate({ author }: { author: TweetAuthor }) {
  if (!author.affiliate) return null
  return (
    <img
      className="affiliate"
      src={author.affiliate.image}
      alt={author.affiliate.label}
      title={author.affiliate.label}
      width={16}
      height={16}
      crossOrigin="anonymous"
      draggable={false}
    />
  )
}

export function TweetText({ segments }: { segments: TextSegment[] }) {
  return segments.map((segment, i) =>
    segment.kind === 'text' ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments never reorder
      <span key={i}>{segment.text}</span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments never reorder
      <span key={i} className="entity">
        {segment.text}
      </span>
    ),
  )
}

function clampRatio(w: number, h: number) {
  return Math.min(2, Math.max(0.75, w / h))
}

function MediaTile({ media }: { media: TweetMedia }) {
  return (
    <div className="media-tile">
      <img src={media.url} alt={media.alt ?? ''} crossOrigin="anonymous" draggable={false} />
      {media.kind === 'video' && (
        <span className="media-play" aria-hidden="true">
          <Play size={26} fill="currentColor" strokeWidth={0} />
        </span>
      )}
      {media.kind === 'gif' && <span className="media-tag">GIF</span>}
      {media.kind === 'video' && media.durationMs ? (
        <span className="media-tag">{formatDuration(media.durationMs)}</span>
      ) : null}
    </div>
  )
}

/** X's media layouts: one tile at its own shape, two to four tiles in a 16:9 grid. */
export function MediaGrid({ media, radius = 16 }: { media: TweetMedia[]; radius?: number }) {
  if (media.length === 0) return null
  const items = media.slice(0, 4)
  const ratio = items.length === 1 ? clampRatio(items[0].width, items[0].height) : 16 / 9
  return (
    <div
      className={`media-grid media-${items.length}`}
      style={{ aspectRatio: String(ratio), borderRadius: radius }}
    >
      {items.map((m) => (
        <MediaTile key={m.url} media={m} />
      ))}
    </div>
  )
}

export function LinkCard({ card }: { card: TweetLinkCard }) {
  if (!card.image) {
    return (
      <div className="link-card link-card-plain">
        <span className="link-card-domain">{card.domain}</span>
        {card.title && <span className="link-card-title">{card.title}</span>}
      </div>
    )
  }
  const ratio =
    card.imageWidth && card.imageHeight ? clampRatio(card.imageWidth, card.imageHeight) : 1.91
  return (
    <div className="link-card">
      <div className="link-card-image" style={{ aspectRatio: String(ratio) }}>
        <img src={card.image} alt="" crossOrigin="anonymous" draggable={false} />
        {card.title && <span className="link-card-overlay">{card.title}</span>}
      </div>
      <span className="link-card-from">From {card.domain}</span>
    </div>
  )
}
