import { formatCount, formatPosted } from '../../lib/format'
import type { CardTheme, Details } from '../../lib/settings'
import type { Tweet } from '../../lib/types'
import { Avatar, MediaGrid, TweetText, VerifiedBadge } from './parts'

interface QuoteCardProps {
  tweet: Tweet
  theme: CardTheme
  details: Details
  /** `bare` drops the card and sets the text straight onto the canvas. */
  bare: boolean
  /** For bare cards: ink chosen against the canvas, not the theme. */
  ink?: 'dark' | 'light'
}

/** Type size steps down as the tweet gets longer, so every tweet fills the same measure. */
function quoteSize(tweet: Tweet): number {
  const length = tweet.segments.reduce((n, s) => n + s.text.length, 0)
  if (length <= 60) return 46
  if (length <= 120) return 38
  if (length <= 200) return 32
  if (length <= 300) return 27
  return 23
}

/** Editorial styles for slides and posts: the same words, set large, with a quiet byline. */
export function QuoteCard({ tweet, theme, details, bare, ink }: QuoteCardProps) {
  const { author, metrics } = tweet
  const posted = formatPosted(tweet.createdAt)
  const bits: string[] = []
  if (details.timestamp) bits.push(posted.date)
  if (details.metrics && metrics.likes !== null) bits.push(`${formatCount(metrics.likes)} likes`)

  return (
    <article
      className={bare ? 'qcard qcard-bare' : 'qcard'}
      data-card-theme={bare ? undefined : theme}
      data-ink={bare ? ink : undefined}
    >
      {tweet.segments.length > 0 && (
        <p
          className="qcard-text"
          lang={tweet.lang}
          dir="auto"
          style={{ fontSize: quoteSize(tweet) }}
        >
          <TweetText segments={tweet.segments} />
        </p>
      )}
      {details.media && tweet.media.length > 0 && (
        <MediaGrid media={tweet.media} radius={bare ? 14 : 18} />
      )}
      <footer className="qcard-byline">
        <Avatar author={author} size={44} />
        <div className="qcard-who">
          <span className="qcard-name">
            {author.name}
            {details.verified && <VerifiedBadge author={author} size={18} />}
          </span>
          <span className="qcard-handle">@{author.handle}</span>
        </div>
        {bits.length > 0 && <span className="qcard-meta">{bits.join(' · ')}</span>}
      </footer>
    </article>
  )
}
