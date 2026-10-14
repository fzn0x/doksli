import { Heart, MessageCircle } from 'lucide-react'
import { formatCount, formatPosted, formatShortDate } from '../../lib/format'
import type { CardTheme, Details } from '../../lib/settings'
import type { Tweet } from '../../lib/types'
import { Affiliate, Avatar, LinkCard, MediaGrid, TweetText, VerifiedBadge } from './parts'

interface CardProps {
  tweet: Tweet
  theme: CardTheme
  details: Details
}

function QuotedTweet({
  tweet,
  details,
}: {
  tweet: NonNullable<Tweet['quoted']>
  details: Details
}) {
  return (
    <div className="xq">
      <div className="xq-head">
        <Avatar author={tweet.author} size={20} />
        <span className="xq-name">{tweet.author.name}</span>
        {details.verified && <VerifiedBadge author={tweet.author} size={16} />}
        <span className="xq-meta">
          @{tweet.author.handle} · {formatShortDate(tweet.createdAt)}
        </span>
      </div>
      <p className="xq-text" lang={tweet.lang} dir="auto">
        <TweetText segments={tweet.segments} />
      </p>
      {details.media && tweet.media.length > 0 && (
        <div className="xq-media">
          <MediaGrid media={tweet.media} radius={0} />
        </div>
      )}
    </div>
  )
}

/** The focal-tweet layout of x.com, kept as close to the original as a stand-in face allows. */
export function XCard({ tweet, theme, details }: CardProps) {
  const { author, metrics } = tweet
  const posted = formatPosted(tweet.createdAt)
  const showMetrics = details.metrics && (metrics.replies !== null || metrics.likes !== null)
  return (
    <article className="xcard" data-card-theme={theme}>
      <header className="xcard-head">
        <Avatar author={author} size={40} />
        <div className="xcard-names">
          <span className="xcard-name">
            <span className="xcard-name-text">{author.name}</span>
            {details.verified && <VerifiedBadge author={author} />}
            {details.verified && <Affiliate author={author} />}
          </span>
          <span className="xcard-handle">@{author.handle}</span>
        </div>
      </header>

      {tweet.replyingTo.length > 0 && (
        <p className="xcard-replying">
          Replying to{' '}
          {tweet.replyingTo.map((h, i) => (
            <span key={h} className="entity">
              {i > 0 ? ' ' : ''}@{h}
            </span>
          ))}
        </p>
      )}

      {tweet.segments.length > 0 && (
        <p className="xcard-text" lang={tweet.lang} dir="auto">
          <TweetText segments={tweet.segments} />
        </p>
      )}

      {details.media && tweet.media.length > 0 && <MediaGrid media={tweet.media} />}
      {details.media && tweet.card && <LinkCard card={tweet.card} />}
      {tweet.quoted && <QuotedTweet tweet={tweet.quoted} details={details} />}

      {details.timestamp && (
        <p className="xcard-time">
          <time dateTime={tweet.createdAt}>
            {posted.time} · {posted.date}
          </time>
          {tweet.isEdited && <span> · Edited</span>}
        </p>
      )}

      {showMetrics && (
        <footer className="xcard-metrics">
          {metrics.replies !== null && (
            <span className="xcard-metric">
              <MessageCircle size={19} strokeWidth={1.75} aria-hidden="true" />
              <strong>{formatCount(metrics.replies)}</strong>
              <span className="sr-only"> replies</span>
            </span>
          )}
          {metrics.likes !== null && (
            <span className="xcard-metric">
              <Heart size={19} strokeWidth={1.75} aria-hidden="true" />
              <strong>{formatCount(metrics.likes)}</strong>
              <span className="sr-only"> likes</span>
            </span>
          )}
        </footer>
      )}
    </article>
  )
}
