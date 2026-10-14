# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, linted and formatted with Biome (the user asked for "latest tech like biome, vite, react"). Deployed on Vercel: a static Vite build plus one serverless function at `/api/tweet` that proxies X's public syndication endpoint. In local development, Vite's dev server runs the same handler.

## Users

Everyone who wants a tweet as an image, with no single primary segment. Confirmed audiences:

- Creators and social media managers reposting tweets to Instagram, TikTok, Stories and LinkedIn.
- People keeping receipts: a faithful copy of a tweet saved before it is edited or deleted, shared as proof.
- Writers and presenters putting tweets into slides, articles and newsletters.

## Product Purpose

Paste a tweet link and download a clean, high-resolution image of that tweet. Success means going from a pasted URL to a downloaded PNG in seconds, with output faithful enough to stand in for the original.

## Positioning

Real tweets only. The app captures what was actually posted, fetched from X by its URL, and offers no way to edit the text, author or numbers. The output cannot become a fabricated tweet. Neighbouring "tweet image generators" that let users type anything cannot honestly make that claim.

## Operating Context

- Input is a tweet URL from x.com or twitter.com (including mobile and share variants), usually copied from the X app or browser and pasted straight in.
- Output is a downloaded image file, also copyable to the clipboard where the browser allows it, that then goes into another app (Instagram, slides, a doc, a chat).
- Used on desktop and on phones. Phone users paste from the X app share sheet.

## Capabilities and Constraints

- Fetching goes through `/api/tweet?id=…`, which proxies `cdn.syndication.twimg.com/tweet-result`. That endpoint only allows CORS from platform.twitter.com, so the browser cannot call it directly.
- Tweet media and avatars (`pbs.twimg.com`) send `access-control-allow-origin: *`, so the browser can rasterize them.
- Content is read-only: no editing of tweet text, author, timestamps or metrics. Presentation options (frame, theme, sizing, which details to show) are allowed.
- Deleted, protected or age-restricted tweets cannot be fetched and need honest error states.
- Card styles: X-faithful by default, plus one or two cleaner editorial styles for slides and posts. All styles show the same unaltered content.
- First-version output controls: card theme (Light, Dim, Dark), canvas background and aspect ratio (Auto, 1:1, 4:5, 9:16, 16:9), show/hide details (metrics, timestamp, media, verified badge), and an optional receipt stamp with the source URL and capture time.
- Undecided: whether quote tweets are rendered inline and whether threads are captured.

## Brand Commitments

The product is called **doksli** (lowercase). The interface is in English.

## Evidence on Hand

None yet. No logo, testimonials, usage numbers or press exist. Do not invent them.

## Product Principles

1. Fidelity over decoration: the captured tweet must read as the real tweet, and presentation never alters content.
2. Paste to PNG in seconds: one input, one obvious action, sensible defaults.
3. Honest about failure: when X refuses a tweet, say why in plain language.
4. Works for every destination: social, slides and archives each get output that fits without extra tools.
