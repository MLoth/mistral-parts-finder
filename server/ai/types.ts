import type { ProviderId } from '#shared/types/ai'

export type AiContentPart
  = | { type: 'text', text: string }
    | { type: 'image', mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', base64: string }

export type AiMessage = { role: 'user' | 'assistant', content: string | AiContentPart[] }

export type AiRequest = {
  system?: string
  messages: AiMessage[]
  /** JSON Schema: when set, the reply is constrained to it and returned parsed in `json` */
  jsonSchema?: Record<string, unknown>
  maxTokens?: number
  effort?: 'low' | 'medium' | 'high'
  /** Which feature is calling, for usage logs (e.g. "part-search") */
  feature: string
}

export type AiResult = {
  text: string
  json?: unknown
  provider: ProviderId
  model: string
  inputTokens: number
  outputTokens: number
}

export type WebSearchRequest = {
  system?: string
  prompt: string
  /** Upper limit on searches the model may run, which is also the upper limit on search cost */
  maxSearches?: number
  maxTokens?: number
}

export type WebSearchResult = {
  text: string
  /** Every page URL the searches returned. Anything the model reports must come from here. */
  urls: string[]
  searches: number
  provider: ProviderId
  model: string
  inputTokens: number
  outputTokens: number
}

export interface AiProvider {
  readonly id: ProviderId
  readonly model: string
  generate(request: AiRequest): Promise<AiResult>
  /** Only providers that can search the web have this */
  webSearch?(request: WebSearchRequest): Promise<WebSearchResult>
}

/** `retryable` errors (rate limit, overload, network) may fall back to another provider. */
export class AiError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly provider: ProviderId) {
    super(message)
  }
}
