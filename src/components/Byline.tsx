import { ArrowUpRight } from 'lucide-react'
import { formatCapturedShort, formatShortDate } from '../lib/format'
import type { Capture } from '../lib/storage'
import { VerifiedBadge } from './cards/parts'

interface BylineProps {
  capture: Capture
  onRemove: () => void
}

/** The feed's author line: who posted it, when, and when doksli captured it. */
export function Byline({ capture, onRemove }: BylineProps) {
  const { tweet } = capture
  const { author } = tweet
  return (
    <div className="byline">
      <div className="byline-who">
        <img
          className={`byline-avatar avatar-${author.shape}`}
          src={author.avatar}
          alt=""
          width={44}
          height={44}
          crossOrigin="anonymous"
        />
        <div className="byline-names">
          <span className="byline-name">
            <span className="truncate">{author.name}</span>
            <VerifiedBadge author={author} size={16} />
            {capture.example && <span className="chip">Example</span>}
          </span>
          <span className="byline-handle">@{author.handle}</span>
        </div>
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
