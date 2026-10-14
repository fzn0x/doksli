import type { Tweet, TweetError } from './types'

export class CaptureError extends Error {}

export async function loadTweet(id: string, signal?: AbortSignal): Promise<Tweet> {
  let res: Response
  try {
    res = await fetch(`/api/tweet?id=${encodeURIComponent(id)}`, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new CaptureError('Could not reach doksli. Check your connection and try again.')
  }
  const body = (await res.json().catch(() => null)) as Tweet | TweetError | null
  if (!body) throw new CaptureError('X sent back something unreadable. Try again in a moment.')
  if ('error' in body) throw new CaptureError(body.message)
  return body
}
