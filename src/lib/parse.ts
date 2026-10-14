const TWEET_HOSTS =
  /(^|\.)(x\.com|twitter\.com|fxtwitter\.com|vxtwitter\.com|fixupx\.com|fixvx\.com|twittpr\.com|nitter\.[a-z.]+)$/i

/**
 * Pulls a status id out of anything a person might paste: full links from x.com or
 * twitter.com (mobile, share and embed-fixer variants included), links without a
 * scheme, or a bare numeric id.
 */
export function parseTweetId(input: string): string | null {
  const value = input.trim()
  if (/^\d{5,20}$/.test(value)) return value

  const candidate = value.match(/\S*(?:status|statuses)\/\d+\S*/i)?.[0]
  if (!candidate) return null

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`)
  } catch {
    return null
  }
  if (!TWEET_HOSTS.test(url.hostname)) return null
  return url.pathname.match(/\/(?:status|statuses)\/(\d{1,20})/i)?.[1] ?? null
}
