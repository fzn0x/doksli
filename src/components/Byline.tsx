import { ArrowUpRight } from 'lucide-react'
import { formatCapturedShort, formatShortDate } from '../lib/format'
import type { Capture } from '../lib/storage'
import { VerifiedBadge } from './cards/parts'

interface BylineProps {
  capture: Capture
  onRemove: () => void
}

/**
 * The feed's author block: the poster's name set as the display line, then the author
 * line (avatar, handle), when it was posted and when doksli captured it.
 */
export function Byline({ capture, onRemove }: BylineProps) {
  const { tweet } = capture
  const { author } = tweet
  return (
    <div className="byline">
      <p className="byline-display" dir="auto">
        {author.name}
      </p>
      <div className="byline-who">
        <img
          className={`byline-avatar avatar-${author.shape}`}
          src={author.avatar}
          alt=""
          width={36}
          height={36}
          crossOrigin="anonymous"
        />
        <span className="byline-handle truncate">@{author.handle}</span>
        <VerifiedBadge author={author} size={17} />
        {capture.example && <span className="chip">Example</span>}
      </div>
      <p className="byline-meta">
        <span>Posted {formatShortDate(tweet.createdAt)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {capture.example ? 'Loaded' : 'Captured'} {formatCapturedShort(capture.capturedAt)}
        </span>
      </p>
      <div className="byline-actions">
        <a className="text-button" href={tweet.url} target="_blank" rel="noreferrer">
          Open on X
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        {!capture.example && (
          <button type="button" className="text-button text-button-quiet" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
