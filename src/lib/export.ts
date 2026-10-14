import { domToBlob } from 'modern-screenshot'

export interface ExportOptions {
  scale: number
}

/**
 * Rasterizes the canvas node at its design size times `scale`. The preview shrinks the node
 * with a transform on an ancestor, so the size comes from layout (offsetWidth), not from
 * getBoundingClientRect. Preview-only layers are skipped.
 */
export function renderPng(node: HTMLElement, { scale }: ExportOptions): Promise<Blob> {
  return domToBlob(node, {
    width: node.offsetWidth,
    height: node.offsetHeight,
    scale,
    type: 'image/png',
    timeout: 20_000,
    filter: (el) => !(el instanceof HTMLElement && el.dataset.previewOnly !== undefined),
    fetch: { requestInit: { mode: 'cors', cache: 'force-cache' } },
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function canCopyImage(): boolean {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write
}

/** Clipboard writes must start inside the click, so the blob is passed as a promise (Safari). */
export async function copyPng(blob: Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export function canShareFiles(): boolean {
  if (typeof navigator.canShare !== 'function') return false
  const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' })
  return navigator.canShare({ files: [probe] })
}

export async function sharePng(blob: Blob, filename: string) {
  await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] })
}
