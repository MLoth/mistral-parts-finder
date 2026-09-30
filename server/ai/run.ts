import type { AiRequest, AiResult } from './types'
import { AiError } from './types'
import { estimateCostUsd } from './registry'
import { configuredProviders, loadSettings } from './settings'
import { logUsage, monthCostUsd } from './usage'

/**
 * The single entry point features use to call an AI model.
 * Uses the default provider; if fallback is enabled, a retryable failure moves on to the next configured provider.
 * Every attempt is logged, and the optional monthly cost limit is enforced.
 */
export async function runAi(request: AiRequest, userUid: string): Promise<AiResult> {
  const settings = await loadSettings()
  const providers = await configuredProviders()
  if (!providers.length) {
    throw createError({ statusCode: 503, statusMessage: 'No AI provider is configured. An admin can add an API key under Admin > AI.' })
  }

  if (settings.monthlyLimitUsd !== null && (await monthCostUsd()) >= settings.monthlyLimitUsd) {
    throw createError({ statusCode: 429, statusMessage: 'The monthly AI budget has been reached.' })
  }

  const attempts = settings.fallbackEnabled ? providers : providers.slice(0, 1)
  let previous: string | undefined
  let lastError: unknown

  for (const provider of attempts) {
    const base = { at: new Date().toISOString(), provider: provider.id, model: provider.model, feature: request.feature, userUid, ...(previous && { fellBackFrom: previous }) }
    try {
      const result = await provider.generate(request)
      await logUsage({ ...base, inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: estimateCostUsd(provider.id, provider.model, result.inputTokens, result.outputTokens), ok: true })
      return result
    } catch (error) {
      lastError = error
      await logUsage({ ...base, inputTokens: 0, outputTokens: 0, costUsd: 0, ok: false, error: error instanceof Error ? error.message : 'error' })
      if (!(error instanceof AiError && error.retryable)) break
      previous = provider.id
    }
  }

  throw createError({ statusCode: 502, statusMessage: lastError instanceof Error ? lastError.message : 'AI request failed' })
}
