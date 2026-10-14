/** A run of tweet text. Links, mentions and tags keep their target so cards can colour them. */
export type TextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention' | 'hashtag' | 'cashtag' | 'url'; text: string; href: string }

export type VerifiedKind = 'blue' | 'business' | 'government'

export interface TweetAuthor {
  name: string
  handle: string
  avatar: string
  shape: 'circle' | 'square'
  verified: VerifiedKind | null
  /** Small affiliate badge X shows beside the name (e.g. an employer logo). */
  affiliate: { image: string; label: string } | null
}

export interface TweetMedia {
  kind: 'photo' | 'video' | 'gif'
  url: string
  width: number
  height: number
  alt: string | null
  durationMs: number | null
}

export interface TweetLinkCard {
  url: string
  domain: string
  title: string | null
  image: string | null
  imageWidth: number | null
  imageHeight: number | null
}

export interface Tweet {
  id: string
  url: string
  createdAt: string
  lang: string
  segments: TextSegment[]
  author: TweetAuthor
  replyingTo: string[]
  media: TweetMedia[]
  card: TweetLinkCard | null
  quoted: Omit<Tweet, 'quoted'> | null
  metrics: { replies: number | null; likes: number | null }
  isEdited: boolean
}

export type TweetErrorCode = 'invalid_id' | 'not_found' | 'unavailable' | 'upstream'

export interface TweetError {
  error: TweetErrorCode
  message: string
}
