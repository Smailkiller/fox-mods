import { expect, test } from 'claude-code/testing'

const props = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 19, contentRows: 0 },
  view: {},
}

test('лис сидит над полем ввода на обеих поверхностях', async $ => {
  const desktop = await $.ui.mount({ plugin: 'fox-on-prompt', surface: 'desktop', component: 'AbovePrompt', props } as never)
  expect(JSON.stringify(await desktop.drawn())).toContain('Svg')

  const terminal = await $.ui.mount({ plugin: 'fox-on-prompt', surface: 'terminal', component: 'AbovePrompt', props } as never)
  expect(JSON.stringify(await terminal.drawn())).toContain('Raster')
})

test('слева полоса контекста по блокам с процентами', async ($, on) => {
  const cat = (name: string, tokens: number, kind: string) => ({ name, tokens, kind, color: 'x', isDeferred: kind === 'deferred' })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('session.usage', () => ({ value: {
    startedAt: 0,
    rateLimits: [],
    context: {
      window: 200000,
      breakdown: {
        categories: [
          cat('System prompt', 4000, 'used'),
          cat('System tools', 16000, 'used'),
          cat('MCP tools', 10000, 'used'),
          cat('Skills', 2000, 'used'),
          cat('Messages', 52000, 'used'),
          cat('Free space', 83000, 'free'),
          cat('Autocompact buffer', 33000, 'buffer'),
          cat('MCP tools (deferred)', 9000, 'deferred'),
        ],
        totalTokens: 84000,
        rawMaxTokens: 200000,
        percentage: 42,
      },
    },
  } }) as never)

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'fox-on-prompt', surface, component: 'AbovePrompt', props } as never)
    expect(JSON.stringify(await ui.drawn())).toContain('ждём первый ответ')
  }

  await $.session.measure({ context: { tokens: 84000, percent: 42, window: 200000 }, rateLimits: [], changed: ['context'] })

  for (const surface of ['desktop', 'terminal'] as const) {
    const drawn = JSON.stringify(await (await $.ui.mount({ plugin: 'fox-on-prompt', surface, component: 'AbovePrompt', props } as never)).drawn())
    expect(drawn).toContain('Контекст 42% · 84k / 200k')
    expect(drawn).toContain('Messages')
    expect(drawn).toContain('26%') // Messages 52k из 200k
    expect(drawn).not.toContain('deferred')
  }
})

test('уступает место опросу', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>опрос</Text>
  })
  const ui = await $.ui.mount({ plugin: 'fox-on-prompt', surface: 'desktop', component: 'AbovePrompt', props: { ...props, hasSurvey: true } } as never)
  expect(JSON.stringify(await ui.drawn())).not.toContain('Svg')
})
