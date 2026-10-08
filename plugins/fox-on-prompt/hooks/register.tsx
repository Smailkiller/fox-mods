import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ContextSegment, ContextSnapshot } from '../types'
import { BAR_HEIGHT, cellSegments, contextSvg, percentLabel, segmentColor, share, tokensLabel } from './chart'
import { FRAMES, FRAME_MS, HEIGHT, WIDTH, sceneCells, sceneSvg } from './sprite'

const PX = 3 // лис 114×63: не выше левой колонки, полосу по высоте не раздвигает
const CHART_W = 460
const ALT = 'Пиксельный лис и крабик курят кальян, лис болтает лапами над полем ввода'

const snapshot = atom({ plugin: 'fox-on-prompt', key: 'snapshot' } as const, null as ContextSnapshot | null)

// Разбивка окна по блокам, как /context; `summary` считает локально, без запросов.
async function measure($: EngineInterface) {
  const { context } = await $.session.usage({ breakdown: 'summary' })
  const b = context.breakdown
  if (!b) return
  const rows = b.categories.filter(c => c.kind !== 'deferred' && c.tokens > 0)
  const segments: ContextSegment[] = [
    ...rows.filter(c => c.kind === 'used').map(c => ({ name: c.name, tokens: c.tokens, kind: 'used' as const })),
    ...rows.filter(c => c.kind === 'free').map(c => ({ name: c.name, tokens: c.tokens, kind: 'free' as const })),
    ...rows.filter(c => c.kind === 'buffer').map(c => ({ name: c.name, tokens: c.tokens, kind: 'buffer' as const })),
  ]
  const next: ContextSnapshot = { segments, total: b.totalTokens, window: b.rawMaxTokens, percent: b.percentage }
  await update($, snapshot, () => next)
}

export const register: Register = on => {
  // В десктопе анимацию крутит сам SVG; в терминале кадры переключает таймер.
  const svg = sceneSvg(PX)
  let frame = 0
  let inTerminal = false

  on('session.start', async ($, e, next) => {
    $.clock.every(FRAME_MS, () => {
      frame = (frame + 1) % FRAMES
      if (inTerminal) $.ui.invalidate('ui.render')
    })
    const result = await next(e)
    await measure($)
    return result
  })

  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    if (e.changed.includes('context')) await measure($)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const snap = await read($, snapshot)
    const title = snap
      ? `Контекст ${Math.round(snap.percent)}% · ${tokensLabel(snap.total)} / ${tokensLabel(snap.window)}`
      : 'Контекст: ждём первый ответ'

    if (e.surface === 'desktop') {
      const { Box, Svg, Text } = $.ui.resolve(e)
      const legend = (snap?.segments ?? [])
        .map((s, i) => ({ s, i, p: share(s.tokens, snap!.window) }))
        .filter(({ s, p }) => s.kind === 'used' && p >= 0.5)
      return (
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end" gap={2}>
          <Box flexDirection="column" flexShrink={1} width={CHART_W}>
            <Text dimColor>{title}</Text>
            {snap ? <Svg source={contextSvg(snap, CHART_W)} alt="Полоса заполнения контекста" width={CHART_W} height={BAR_HEIGHT} /> : null}
            <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
              {legend.map(({ s, i, p }) => (
                <Text key={`l${i}`}>
                  <Text color={segmentColor(s, i)}>■ </Text>
                  <Text dimColor>{s.name} </Text>
                  <Text bold>{percentLabel(p)}</Text>
                </Text>
              ))}
            </Box>
          </Box>
          <Svg source={svg} alt={ALT} width={WIDTH * PX} height={HEIGHT * PX} />
        </Box>
      )
    }

    if (e.surface === 'terminal') {
      const art = sceneCells(frame)
      if (e.props.maxRows < art.rows || e.props.bodyColumns < art.columns) return next(e)
      inTerminal = true
      const room = Math.max(0, e.props.bodyColumns - art.columns - 2)
      const { Box, Raster, Text } = $.ui.resolve(e)
      const cells = snap ? cellSegments(snap, room) : []
      return (
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end">
          <Box flexDirection="column">
            <Text dimColor wrap="truncate">{title}</Text>
            <Box flexDirection="row">
              {cells.map((c, i) => {
                const text = c.label.length <= c.cells ? c.label : ''
                const left = Math.floor((c.cells - text.length) / 2)
                return (
                  <Text key={`s${i}`} backgroundColor={c.color} color={c.segment.kind === 'used' ? '#141414' : '#bdbdb8'}>
                    {' '.repeat(left) + text + ' '.repeat(c.cells - left - text.length)}
                  </Text>
                )
              })}
            </Box>
            <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
              {(snap?.segments ?? []).map((s, i) =>
                s.kind === 'free' ? null : (
                  <Text key={`l${i}`}>
                    <Text color={segmentColor(s, i)}>■ </Text>
                    <Text dimColor>{s.kind === 'buffer' ? 'Буфер сжатия' : s.name} </Text>
                    <Text bold>{percentLabel(share(s.tokens, snap!.window))}</Text>
                  </Text>
                ),
              )}
            </Box>
          </Box>
          <Raster key="fox" {...art} />
        </Box>
      )
    }

    return next(e)
  })
}
