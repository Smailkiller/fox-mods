export type ContextSegment = { name: string; tokens: number; kind: 'used' | 'free' | 'buffer' }

export type ContextSnapshot = { segments: ContextSegment[]; total: number; window: number; percent: number }

declare module 'claude-code' {
  interface PluginState {
    'fox-on-prompt': { snapshot: ContextSnapshot | null }
  }
}
