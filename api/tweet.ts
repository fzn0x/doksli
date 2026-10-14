/**
 * GET /api/tweet?id=<status id>
 *
 * Proxies X's public syndication endpoint (the one embedded tweets use) and
 * returns a lean, normalized tweet. The endpoint only allows CORS from
 * platform.twitter.com, so browsers cannot call it directly.
 *
 * Runs as a Vercel Function in production and as Vite middleware in dev.
 */
import type {
  TextSegment,
  Tweet,
  TweetError,
  TweetErrorCode,
  TweetLinkCard,
  TweetMedia,
  VerifiedKind,
} from '../src/lib/types.ts'

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result'

const FEATURES = [
  'tfw_timeline_list:',
  'tfw_follower_count_sunset:true',
  'tfw_tweet_edit_backend:on',
  'tfw_refsrc_session:on',
  'tfw_fosnr_soft_interventions_enabled:on',
  'tfw_show_birdwatch_pivots_enabled:on',
  'tfw_show_business_verified_badge:on',
  'tfw_duplicate_scribes_to_settings:on',
  'tfw_use_profile_image_shape_enabled:on',
  'tfw_show_blue_verified_badge:on',
  'tfw_legacy_timeline_sunset:true',
  'tfw_show_gov_verified_badge:on',
  'tfw_show_business_affiliate_badge:on',
  'tfw_tweet_edit_frontend:on',
].join(';')

interface RawIndexed {
  indices: [number, number]
}
interface RawEntities {
  hashtags?: (RawIndexed & { text: string })[]
  user_mentions?: (RawIndexed & { screen_name: string })[]
  urls?: (RawIndexed & { url: string; display_url: string; expanded_url: string })[]
  symbols?: (RawIndexed & { text: string })[]
  media?: RawIndexed[]
}
interface RawImageValue {
  image_value?: { url: string; width: number; height: number }
  string_value?: string
}
interface RawTweet {
  __typename?: string
  tombstone?: { text?: { text?: string } }
  id_str: string
  text: string
  lang?: string
  created_at: string
  display_text_range?: [number, number]
  entities?: RawEntities
  in_reply_to_screen_name?: string
  favorite_count?: number
  conversation_count?: number
  isEdited?: boolean
  user: {
    name: string
    screen_name: string
    profile_image_url_https: string
    profile_image_shape?: string
    is_blue_verified?: boolean
    verified?: boolean
    verified_type?: string
    highlighted_label?: { badge?: { url?: string }; description?: string }
  }
  mediaDetails?: {
    type: 'photo' | 'video' | 'animated_gif'
    media_url_https: string
    original_info?: { width: number; height: number }
    ext_alt_text?: string
    video_info?: { duration_millis?: number }
  }[]
  card?: { url?: string; binding_values?: Record<string, RawImageValue | undefined> }
  quoted_tweet?: RawTweet
}

/** The token X's own embed computes for a status id. */
function tokenFor(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function buildSegments(raw: RawTweet): { segments: TextSegment[]; replyingTo: string[] } {
  const chars = Array.from(raw.text)
  const entities = raw.entities ?? {}
  const [start, rangeEnd] = raw.display_text_range ?? [0, chars.length]
  // X hides trailing media links; its display range is sometimes one character long.
  const mediaStart = Math.min(...(entities.media ?? []).map((m) => m.indices[0]))
  const end = Math.min(rangeEnd, mediaStart)
  const quotedId = raw.quoted_tweet?.id_str

  type Marked = { start: number; end: number; segment: TextSegment }
  const marks: Marked[] = []
  for (const tag of entities.hashtags ?? []) {
    marks.push({
      start: tag.indices[0],
      end: tag.indices[1],
      segment: {
        kind: 'hashtag',
        text: `#${tag.text}`,
        href: `https://x.com/hashtag/${encodeURIComponent(tag.text)}`,
      },
    })
  }
  for (const sym of entities.symbols ?? []) {
    marks.push({
      start: sym.indices[0],
      end: sym.indices[1],
      segment: {
        kind: 'cashtag',
        text: `$${sym.text}`,
        href: `https://x.com/search?q=%24${encodeURIComponent(sym.text)}`,
      },
    })
  }
  for (const mention of entities.user_mentions ?? []) {
    marks.push({
      start: mention.indices[0],
      end: mention.indices[1],
      segment: {
        kind: 'mention',
        text: `@${mention.screen_name}`,
        href: `https://x.com/${mention.screen_name}`,
      },
    })
  }
  for (const link of entities.urls ?? []) {
    // The quoted tweet renders as a card, so its permalink is dropped from the text.
    if (quotedId && link.expanded_url.includes(`/status/${quotedId}`)) {
      marks.push({
        start: link.indices[0],
        end: link.indices[1],
        segment: { kind: 'text', text: '' },
      })
      continue
    }
    marks.push({
      start: link.indices[0],
      end: link.indices[1],
      segment: { kind: 'url', text: link.display_url, href: link.expanded_url },
    })
  }
  marks.sort((a, b) => a.start - b.start)

  const replyingTo = marks
    .filter((m) => m.segment.kind === 'mention' && m.end <= start)
    .map((m) => m.segment.text.slice(1))

  const segments: TextSegment[] = []
  let cursor = start
  const pushText = (from: number, to: number) => {
    if (to <= from) return
    const text = decodeEntities(chars.slice(from, to).join(''))
    const last = segments.at(-1)
    if (last?.kind === 'text') last.text += text
    else segments.push({ kind: 'text', text })
  }
  for (const mark of marks) {
    if (mark.start < cursor || mark.end > end) continue
    pushText(cursor, mark.start)
    segments.push(mark.segment)
    cursor = mark.end
  }
  pushText(cursor, end)

  // X trims the whitespace left behind by stripped links.
  const kept = segments.filter((s) => s.text.length > 0)
  const last = kept.at(-1)
  if (last?.kind === 'text') last.text = last.text.trimEnd()
  const first = kept[0]
  if (first?.kind === 'text') first.text = first.text.trimStart()

  return { segments: kept.filter((s) => s.text.length > 0), replyingTo }
}

function verifiedKind(user: RawTweet['user']): VerifiedKind | null {
  if (user.verified_type === 'Business') return 'business'
  if (user.verified_type === 'Government') return 'government'
  if (user.is_blue_verified || user.verified) return 'blue'
  return null
}

function largePhoto(url: string): string {
  const match = url.match(/^(https:\/\/pbs\.twimg\.com\/media\/[^.?]+)\.(\w+)/)
  return match ? `${match[1]}?format=${match[2]}&name=large` : url
}

function normalizeMedia(raw: RawTweet): TweetMedia[] {
  return (raw.mediaDetails ?? []).map((m) => ({
    kind: m.type === 'animated_gif' ? 'gif' : m.type,
    url: m.type === 'photo' ? largePhoto(m.media_url_https) : m.media_url_https,
    width: m.original_info?.width ?? 1200,
    height: m.original_info?.height ?? 675,
    alt: m.ext_alt_text ?? null,
    durationMs: m.video_info?.duration_millis ?? null,
  }))
}

function normalizeCard(raw: RawTweet): TweetLinkCard | null {
  const values = raw.card?.binding_values
  if (!values || (raw.mediaDetails?.length ?? 0) > 0) return null
  const image =
    values.photo_image_full_size_large?.image_value ??
    values.summary_photo_image_large?.image_value ??
    values.thumbnail_image_large?.image_value ??
    null
  const domain = values.vanity_url?.string_value ?? values.domain?.string_value
  if (!domain) return null
  const tco = raw.card?.url
  const expanded = raw.entities?.urls?.find((u) => u.url === tco)?.expanded_url
  return {
    url: expanded ?? tco ?? `https://${domain}`,
    domain,
    title: values.title?.string_value ?? null,
    image: image?.url ?? null,
    imageWidth: image?.width ?? null,
    imageHeight: image?.height ?? null,
  }
}

function normalize(raw: RawTweet): Omit<Tweet, 'quoted'> {
  const { segments, replyingTo } = buildSegments(raw)
  const user = raw.user
  const label = user.highlighted_label
  return {
    id: raw.id_str,
    url: `https://x.com/${user.screen_name}/status/${raw.id_str}`,
    createdAt: raw.created_at,
    lang: raw.lang ?? 'und',
    segments,
    author: {
      name: user.name,
      handle: user.screen_name,
      avatar: user.profile_image_url_https.replace('_normal.', '_400x400.'),
      shape: user.profile_image_shape === 'Square' ? 'square' : 'circle',
      verified: verifiedKind(user),
      affiliate: label?.badge?.url
        ? { image: label.badge.url, label: label.description ?? '' }
        : null,
    },
    replyingTo:
      replyingTo.length > 0
        ? replyingTo
        : raw.in_reply_to_screen_name
          ? [raw.in_reply_to_screen_name]
          : [],
    media: normalizeMedia(raw),
    card: normalizeCard(raw),
    metrics: {
      replies: raw.conversation_count ?? null,
      likes: raw.favorite_count ?? null,
    },
    isEdited: raw.isEdited ?? false,
  }
}

const MESSAGES: Record<TweetErrorCode, string> = {
  invalid_id: 'That is not a tweet ID.',
  not_found: 'X could not find this tweet. It may have been deleted, or the link is wrong.',
  unavailable:
    'X will not show this tweet. It may be from a protected account, age-restricted, or removed.',
  upstream: 'X did not answer. Wait a moment and try again.',
}

function fail(code: TweetErrorCode, status: number, message = MESSAGES[code]): Response {
  const body: TweetError = { error: code, message }
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
}

export async function fetchTweet(id: string): Promise<Response> {
  if (!/^\d{1,20}$/.test(id)) return fail('invalid_id', 400)

  const url = new URL(SYNDICATION_URL)
  url.searchParams.set('id', id)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('token', tokenFor(id))
  url.searchParams.set('features', FEATURES)

  let upstream: globalThis.Response
  try {
    upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return fail('upstream', 504)
  }

  if (upstream.status === 404) return fail('not_found', 404)
  if (!upstream.ok) return fail('upstream', 502)

  let raw: RawTweet
  try {
    raw = (await upstream.json()) as RawTweet
  } catch {
    return fail('upstream', 502)
  }

  if (raw.__typename === 'TweetTombstone') {
    const reason = raw.tombstone?.text?.text?.replace(/\s*Learn more\.?$/, '')
    return fail('unavailable', 410, reason || MESSAGES.unavailable)
  }
  if (!raw.id_str || !raw.user) return fail('not_found', 404)

  const tweet: Tweet = {
    ...normalize(raw),
    quoted: raw.quoted_tweet?.user ? normalize(raw.quoted_tweet) : null,
  }
  return Response.json(tweet, {
    headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400' },
  })
}

export function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  return fetchTweet(id)
}
