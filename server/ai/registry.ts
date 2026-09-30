import type { ProviderId } from '#shared/types/ai'
import type { AiProvider } from './types'
import { createClaudeProvider } from './providers/claude'

type ProviderDef = {
  id: ProviderId
  name: string
  models: { id: string, label: string, inputUsdPerMTok: number, outputUsdPerMTok: number }[]
  create: (apiKey: string, model: string) => AiProvider
}

/** Add a provider (e.g. Gemini) by adding an entry here and widening ProviderId. */
export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', inputUsdPerMTok: 4, outputUsdPerMTok: 20 },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', inputUsdPerMTok: 2, outputUsdPerMTok: 10 },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', inputUsdPerMTok: 1, outputUsdPerMTok: 5 }
    ],
    create: createClaudeProvider
  }
}

export const isProviderId = (id: string): id is ProviderId => id in PROVIDERS

export function estimateCostUsd(provider: ProviderId, model: string, inputTokens: number, outputTokens: number) {
  const m = PROVIDERS[provider].models.find(x => x.id === model)
  return m ? (inputTokens * m.inputUsdPerMTok + outputTokens * m.outputUsdPerMTok) / 1_000_000 : 0
}
