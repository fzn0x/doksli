import { CircleAlert, LoaderCircle } from 'lucide-react'
import { type FormEvent, useId } from 'react'
import { isMac } from '../hooks'
import { parseTweetId } from '../lib/parse'

export type CaptureStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }

interface CaptureBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  status: CaptureStatus
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function CaptureBar({ value, onChange, onSubmit, status, inputRef }: CaptureBarProps) {
  const hintId = useId()
  const loading = status.kind === 'loading'
  const error = status.kind === 'error' ? status.message : null
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(value)
  }
  return (
    <form className="capture" onSubmit={submit} data-error={error ? true : undefined}>
      <div className="capture-pill">
        <label className="sr-only" htmlFor="capture-input">
          Tweet link
        </label>
        <input
          ref={inputRef}
          id="capture-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Paste an x.com link"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (text && parseTweetId(text)) {
              e.preventDefault()
              onChange(text.trim())
              onSubmit(text)
            }
          }}
        />
        <button type="submit" className="capture-button" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} aria-hidden="true" />
              <span>Capturing</span>
            </>
          ) : (
            'Capture'
          )}
        </button>
      </div>
      <p id={hintId} className="capture-hint" aria-live="polite">
        {error ? (
          <>
            <CircleAlert size={15} aria-hidden="true" />
            <span>{error}</span>
          </>
        ) : (
          <span>
            Or press <kbd>{isMac() ? '⌘' : 'Ctrl'}</kbd> <kbd>V</kbd> anywhere. doksli fetches the
            real tweet; nothing is retyped.
          </span>
        )}
      </p>
    </form>
  )
}
