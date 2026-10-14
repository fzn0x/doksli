import { ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Byline } from './components/Byline'
import { CaptureBar, type CaptureStatus } from './components/CaptureBar'
import { Panel, type PanelId } from './components/Panel'
import { Rail, type RailAction } from './components/Rail'
import { type CanvasGeometry, TweetCanvas } from './components/TweetCanvas'
import { type Layout, useLayout, usePrefersReducedMotion, useSpill } from './hooks'
import { CaptureError, loadTweet } from './lib/api'
import {
  canCopyImage,
  canShareFiles,
  copyPng,
  downloadBlob,
  renderPng,
  sharePng,
} from './lib/export'
import { parseTweetId } from './lib/parse'
import type { Settings } from './lib/settings'
import { spillSource } from './lib/spill'
import {
  type Capture,
  loadCaptures,
  loadSettings,
  MAX_CAPTURES,
  saveCaptures,
  saveSettings,
} from './lib/storage'

const EXAMPLE_ID = '20'

interface FeedItemProps {
  capture: Capture
  index: number
  active: boolean
  nearby: boolean
  settings: Settings
  layout: Layout
  canvasRef: React.RefObject<HTMLDivElement | null>
  onSize: (size: CanvasGeometry) => void
  rail: React.ReactNode
  onRemove: () => void
}

function FeedItem({
  capture,
  index,
  active,
  nearby,
  settings,
  layout,
  canvasRef,
  onSize,
  rail,
  onRemove,
}: FeedItemProps) {
  const spill = useSpill(nearby ? spillSource(capture.tweet) : null)
  return (
    <section
      className="feed-item"
      data-index={index}
      aria-label={`Capture ${index + 1}: ${capture.tweet.author.name}`}
      aria-current={active || undefined}
    >
      <div className="feed-byline">
        <Byline capture={capture} onRemove={onRemove} />
      </div>
      <div className="feed-stage">
        {nearby ? (
          <TweetCanvas
            capture={capture}
            settings={settings}
            spill={spill}
            avail={layout.avail}
            canvasRef={active ? canvasRef : undefined}
            onSize={active ? onSize : undefined}
          />
        ) : (
          <div className="stage stage-placeholder" style={{ height: layout.avail.height * 0.8 }} />
        )}
        {rail}
      </div>
    </section>
  )
}

function EmptyItem({ loading, onExample }: { loading: boolean; onExample: () => void }) {
  return (
    <section className="feed-item feed-empty" aria-label="Nothing captured yet">
      <div className="empty">
        <h1 className="empty-title">Tweet in. Image out.</h1>
        <p className="empty-copy">
          Paste a link from x.com or twitter.com. doksli fetches the real tweet from X and lays it
          out as a picture you can post, present or keep as proof.
        </p>
        <button type="button" className="pill pill-ghost" onClick={onExample} disabled={loading}>
          {loading && <LoaderCircle className="spin" size={16} aria-hidden="true" />}
          {loading ? 'Loading example' : 'Try an example'}
        </button>
      </div>
    </section>
  )
}

function Backdrop({ capture }: { capture: Capture | undefined }) {
  const spill = useSpill(capture ? spillSource(capture.tweet) : null)
  const [layers, setLayers] = useState<string[]>([])
  useEffect(() => {
    if (!spill) return
    setLayers((prev) => (prev.at(-1) === spill ? prev : [...prev.slice(-1), spill]))
  }, [spill])
  return (
    <div className="backdrop" aria-hidden="true">
      {layers.map((src, i) => (
        <img key={src} src={src} alt="" data-leaving={i < layers.length - 1 || undefined} />
      ))}
    </div>
  )
}

function filenameFor(capture: Capture) {
  return `doksli-${capture.tweet.author.handle}-${capture.tweet.id}.png`
}

export function App() {
  const [captures, setCaptures] = useState<Capture[]>(loadCaptures)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [active, setActive] = useState(0)
  const [panel, setPanel] = useState<{ id: PanelId; anchor: HTMLElement } | null>(null)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<CaptureStatus>({ kind: 'idle' })
  const [exampleLoading, setExampleLoading] = useState(false)
  const [busy, setBusy] = useState<RailAction | null>(null)
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const [output, setOutput] = useState<CanvasGeometry | null>(null)
  const [scrollTarget, setScrollTarget] = useState<{ index: number; key: number } | null>(null)

  const layout = useLayout(panel !== null)
  const reducedMotion = usePrefersReducedMotion()
  const feedRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)

  const secondary = useMemo<'copy' | 'share' | null>(() => {
    if (layout.mobile && canShareFiles()) return 'share'
    return canCopyImage() ? 'copy' : null
  }, [layout.mobile])

  useEffect(() => saveCaptures(captures), [captures])
  useEffect(() => saveSettings(settings), [settings])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const say = useCallback((text: string) => setToast({ text, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const goTo = useCallback(
    (index: number) => {
      const target = feedRef.current?.children[index] as HTMLElement | undefined
      target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    },
    [reducedMotion],
  )

  useEffect(() => {
    if (!scrollTarget) return
    goTo(scrollTarget.index)
  }, [scrollTarget, goTo])

  const capture = useCallback(async (raw: string) => {
    if (raw.trim() === '') {
      setStatus({ kind: 'error', message: 'Paste a tweet link first.' })
      inputRef.current?.focus()
      return
    }
    const id = parseTweetId(raw)
    if (!id) {
      setStatus({
        kind: 'error',
        message: 'That is not a tweet link. Copy the link from a post on x.com and paste it here.',
      })
      return
    }
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setStatus({ kind: 'loading' })
    try {
      const tweet = await loadTweet(id, controller.signal)
      setCaptures((prev) =>
        [
          { tweet, capturedAt: new Date().toISOString() },
          ...prev.filter((c) => c.tweet.id !== tweet.id && !c.example),
        ].slice(0, MAX_CAPTURES),
      )
      setActive(0)
      setScrollTarget({ index: 0, key: Date.now() })
      setStatus({ kind: 'idle' })
      setInput('')
    } catch (err) {
      if (controller.signal.aborted) return
      setStatus({
        kind: 'error',
        message: err instanceof CaptureError ? err.message : 'Something went wrong. Try again.',
      })
    }
  }, [])

  const loadExample = useCallback(async () => {
    setExampleLoading(true)
    try {
      const tweet = await loadTweet(EXAMPLE_ID)
      setCaptures((prev) =>
        prev.length > 0 ? prev : [{ tweet, capturedAt: new Date().toISOString(), example: true }],
      )
    } catch {
      // The empty state stays up with its button; nothing else depends on the example.
    } finally {
      setExampleLoading(false)
    }
  }, [])

  // First visit: show the mechanism working instead of an empty frame.
  const firstVisit = useRef(captures.length === 0)
  useEffect(() => {
    if (firstVisit.current) {
      firstVisit.current = false
      loadExample()
    }
  }, [loadExample])

  // Track which capture fills the screen. Re-observe whenever the list of items changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: captures changes the observed children
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index ?? 0))
          }
        }
      },
      { root: feed, threshold: 0.6 },
    )
    for (const child of Array.from(feed.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [captures])

  const activeIndex = Math.min(active, Math.max(0, captures.length - 1))
  const current = captures[activeIndex]

  // An open panel follows the feed: re-anchor it to the rail of the capture now on screen.
  useEffect(() => {
    setPanel((prev) => {
      if (!prev) return prev
      const anchor = feedRef.current?.querySelector<HTMLElement>(
        `[data-index="${activeIndex}"] [data-panel="${prev.id}"]`,
      )
      return anchor && anchor !== prev.anchor ? { ...prev, anchor } : prev
    })
  }, [activeIndex])

  // Paste a link anywhere; arrows and J/K move through the feed.
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    const onPaste = (e: ClipboardEvent) => {
      if (isField(e.target)) return
      const text = e.clipboardData?.getData('text') ?? ''
      if (!text.trim()) return
      e.preventDefault()
      setInput(text.trim())
      capture(text)
    }
    const onKey = (e: KeyboardEvent) => {
      if (isField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        goTo(Math.min(captures.length - 1, activeIndex + 1))
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goTo(Math.max(0, activeIndex - 1))
      } else if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('paste', onPaste)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('keydown', onKey)
    }
  }, [capture, goTo, activeIndex, captures.length])

  const remove = useCallback((id: string) => {
    setCaptures((prev) => prev.filter((c) => c.tweet.id !== id))
  }, [])

  const togglePanel = useCallback((id: PanelId, anchor: HTMLElement) => {
    setPanel((prev) => (prev?.id === id ? null : { id, anchor }))
  }, [])
  const closePanel = useCallback(() => setPanel(null), [])

  const act = useCallback(
    async (action: RailAction) => {
      const node = canvasRef.current
      if (!node || !current) return
      const filename = filenameFor(current)
      setBusy(action)
      try {
        const render = document.fonts.ready.then(() =>
          renderPng(node, { scale: settings.resolution }),
        )
        if (action === 'copy') {
          await copyPng(render)
          say('Image copied. Paste it anywhere.')
        } else if (action === 'share') {
          const blob = await render
          try {
            await sharePng(blob, filename)
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            downloadBlob(blob, filename)
            say(`Saved ${filename}`)
          }
        } else {
          downloadBlob(await render, filename)
          say(`Saved ${filename}`)
        }
      } catch {
        say(
          action === 'copy'
            ? 'Your browser blocked copying. Use Download instead.'
            : 'The image could not be rendered. Try again.',
        )
      } finally {
        setBusy(null)
      }
    },
    [current, settings.resolution, say],
  )

  const outputLabel = output
    ? `${output.width * settings.resolution}×${output.height * settings.resolution}`
    : null

  const panelSpill = useSpill(current ? spillSource(current.tweet) : null)

  return (
    <div
      className="app"
      data-mobile={layout.mobile || undefined}
      data-sheet={panel && layout.mobile ? true : undefined}
    >
      <Backdrop capture={current} />

      <header className="masthead">
        <span className="wordmark">doksli</span>
        <span className="tagline">Tweets, kept as images</span>
      </header>

      <main ref={feedRef} className="feed" aria-label="Captured tweets">
        {captures.length === 0 ? (
          <EmptyItem loading={exampleLoading} onExample={loadExample} />
        ) : (
          captures.map((c, i) => (
            <FeedItem
              key={c.tweet.id}
              capture={c}
              index={i}
              active={i === activeIndex}
              nearby={Math.abs(i - activeIndex) <= 1}
              settings={settings}
              layout={layout}
              canvasRef={canvasRef}
              onSize={setOutput}
              onRemove={() => remove(c.tweet.id)}
              rail={
                <Rail
                  live={i === activeIndex}
                  openPanel={i === activeIndex ? (panel?.id ?? null) : null}
                  onToggle={togglePanel}
                  onAction={act}
                  busy={busy}
                  secondary={secondary}
                  output={outputLabel}
                />
              }
            />
          ))
        )}
      </main>

      <div className="capture-dock">
        <CaptureBar
          value={input}
          onChange={(v) => {
            setInput(v)
            if (status.kind === 'error') setStatus({ kind: 'idle' })
          }}
          onSubmit={capture}
          status={status}
          inputRef={inputRef}
        />
      </div>

      {captures.length > 1 && (
        <nav className="feed-nav" aria-label="Move through captures">
          <button
            type="button"
            className="icon-button icon-button-ring"
            aria-label="Newer capture"
            disabled={activeIndex === 0}
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronUp size={20} />
          </button>
          <span className="feed-count tabular" aria-live="polite">
            {activeIndex + 1}
            <span aria-hidden="true">/</span>
            <span className="sr-only"> of </span>
            {captures.length}
          </span>
          <button
            type="button"
            className="icon-button icon-button-ring"
            aria-label="Older capture"
            disabled={activeIndex === captures.length - 1}
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronDown size={20} />
          </button>
        </nav>
      )}

      {panel && current && (
        <Panel
          id={panel.id}
          anchor={panel.anchor}
          settings={settings}
          update={update}
          spill={panelSpill}
          output={output}
          mobile={layout.mobile}
          onClose={closePanel}
        />
      )}

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <p key={toast.key} className="toast">
            {toast.text}
          </p>
        )}
      </div>
    </div>
  )
}
