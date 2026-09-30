export type ProviderId = 'claude'

export type ProviderStatus = {
  id: ProviderId
  name: string
  models: { id: string, label: string }[]
  configured: boolean
  keyLast4: string | null
  model: string
  updatedAt: string | null
}

export type AiSettingsView = {
  providers: ProviderStatus[]
  defaultProvider: ProviderId | null
  fallbackEnabled: boolean
  monthlyLimitUsd: number | null
}

export type UsageSummary = {
  days: number
  requests: number
  failures: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  monthCostUsd: number
  byProvider: Record<string, { requests: number, costUsd: number }>
}
