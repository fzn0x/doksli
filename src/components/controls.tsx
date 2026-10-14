import { Check, Plus } from 'lucide-react'
import { type ReactNode, useId } from 'react'

interface Option<T extends string | number> {
  value: T
  label: ReactNode
  hint?: string
}

/**
 * Every choice below is a native radio group under its custom skin, so arrow keys,
 * form semantics and screen readers behave exactly as the platform does.
 */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="segmented">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={String(option.value)} title={option.hint}>
          <input
            type="radio"
            className="sr-only"
            name={name}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="switch-row">
      <div className="switch-text">
        <label htmlFor={id}>{label}</label>
        {description && <span>{description}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  )
}

export interface Swatch {
  id: string
  label: string
  css: string
  image?: string | null
}

export function SwatchGrid({
  label,
  swatches,
  value,
  onChange,
}: {
  label: string
  swatches: Swatch[]
  value: string
  onChange: (id: string) => void
}) {
  const name = useId()
  const custom = /^#[0-9a-f]{6}$/i.test(value) ? value : null
  return (
    <fieldset className="swatches">
      <legend className="sr-only">{label}</legend>
      {swatches.map((swatch) => {
        const checked = swatch.id === value
        const paint =
          swatch.id === 'transparent'
            ? undefined
            : swatch.image
              ? `center / cover url(${swatch.image})`
              : swatch.css
        return (
          <label
            key={swatch.id}
            className="swatch"
            data-kind={swatch.id}
            title={swatch.label}
            style={paint ? { background: paint } : undefined}
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              aria-label={swatch.label}
              checked={checked}
              onChange={() => onChange(swatch.id)}
            />
            {checked && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
          </label>
        )
      })}
      <label
        className="swatch swatch-custom"
        title="Pick any colour"
        data-checked={custom ? true : undefined}
        style={custom ? { background: custom } : undefined}
      >
        <input
          type="color"
          aria-label="Custom colour"
          value={custom ?? '#7a5cff'}
          onChange={(e) => onChange(e.target.value)}
        />
        {custom ? (
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Plus size={16} aria-hidden="true" />
        )}
      </label>
    </fieldset>
  )
}

export function OptionList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: (Option<T> & { description: string })[]
  value: T
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="option-list">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label key={option.value} className="option">
            <input
              type="radio"
              className="sr-only"
              name={name}
              checked={checked}
              onChange={() => onChange(option.value)}
            />
            <span className="option-text">
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </span>
            <span className="option-check" aria-hidden="true">
              {checked && <Check size={16} strokeWidth={2.5} />}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label" aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  )
}
