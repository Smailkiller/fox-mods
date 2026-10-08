// Полоса заполнения контекста по блокам, как /context: отрезок на блок,
// процент от окна внутри отрезка, подписи блоков под полосой.

import type { ContextSegment, ContextSnapshot } from '../types'

const COLORS: Record<string, string> = {
  'System prompt': '#8a8f98',
  'System tools': '#5b8def',
  'MCP tools': '#36b3a8',
  'Custom agents': '#4fb06d',
  'Memory files': '#d18ad6',
  Skills: '#e0a43a',
  'Slash commands': '#c9a227',
  Messages: '#d97757',
}
const FALLBACK = ['#9a7fe0', '#5fb8e6', '#e07a9a', '#a3b84a']
const FREE = '#3a3a38'
const BUFFER = '#55554f'

export function segmentColor(s: ContextSegment, i: number): string {
  if (s.kind === 'free') return FREE
  if (s.kind === 'buffer') return BUFFER
  return COLORS[s.name] ?? FALLBACK[i % FALLBACK.length]!
}

export const tokensLabel = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`

export const share = (tokens: number, window: number) => (window > 0 ? (tokens / window) * 100 : 0)

export const percentLabel = (p: number) => (p >= 10 ? `${Math.round(p)}%` : p >= 1 ? `${p.toFixed(1)}%` : '<1%')

// Цифры пиксельным шрифтом 3×5: в SVG только path с заливкой, как у лиса,
// без text, clipPath и ссылок — десктоп рисует такое картинкой без сбоев.
const GLYPHS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '.': ['0', '0', '0', '0', '1'],
  '<': ['001', '010', '100', '010', '001'],
  '%': ['101', '001', '010', '100', '101'],
}
const DOT = 2 // пикселей на точку шрифта

const glyphWidth = (ch: string) => (GLYPHS[ch]?.[0]?.length ?? 3) * DOT
const textWidth = (text: string) => [...text].reduce((w, ch) => w + glyphWidth(ch) + DOT, -DOT)

function pixelText(text: string, cx: number, cy: number): string {
  let x = Math.round(cx - textWidth(text) / 2)
  const y = Math.round(cy - (5 * DOT) / 2)
  let d = ''
  for (const ch of text) {
    const rows = GLYPHS[ch] ?? []
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === '1') d += `M${x + c * DOT} ${y + r * DOT}h${DOT}v${DOT}h-${DOT}z`
    })
    x += glyphWidth(ch) + DOT
  }
  return d
}

export const BAR_HEIGHT = 18

/** Полоса: отрезок на блок, доля окна внутри, если влезает. */
export function contextSvg(snap: ContextSnapshot, width: number): string {
  let x = 0
  const rects: string[] = []
  let darkInk = ''
  let lightInk = ''
  snap.segments.forEach((s, i) => {
    const p = share(s.tokens, snap.window)
    const w = (p / 100) * width
    if (w <= 0) return
    rects.push(`<path fill="${segmentColor(s, i)}" d="M${x.toFixed(2)} 0h${w.toFixed(2)}v${BAR_HEIGHT}h-${w.toFixed(2)}z"/>`)
    const label = percentLabel(p)
    if (textWidth(label) + 6 <= w) {
      const d = pixelText(label, x + w / 2, BAR_HEIGHT / 2)
      if (s.kind === 'used') darkInk += d
      else lightInk += d
    }
    x += w
  })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${BAR_HEIGHT}" viewBox="0 0 ${width} ${BAR_HEIGHT}" shape-rendering="crispEdges">` +
    `<path fill="${FREE}" d="M0 0h${width}v${BAR_HEIGHT}h-${width}z"/>` +
    rects.join('') +
    (darkInk ? `<path fill="#141414" d="${darkInk}"/>` : '') +
    (lightInk ? `<path fill="#d8d8d3" d="${lightInk}"/>` : '') +
    `</svg>`
  )
}

/** Для терминала: отрезки по клеткам, сколько клеток на блок. */
export function cellSegments(snap: ContextSnapshot, columns: number) {
  const out: { cells: number; color: string; label: string; segment: ContextSegment }[] = []
  let used = 0
  snap.segments.forEach((s, i) => {
    const p = share(s.tokens, snap.window)
    const cells = Math.min(columns - used, Math.round((p / 100) * columns))
    if (cells <= 0) return
    out.push({ cells, color: segmentColor(s, i), label: percentLabel(p), segment: s })
    used += cells
  })
  return out
}
