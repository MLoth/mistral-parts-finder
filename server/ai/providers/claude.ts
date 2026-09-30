import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, AiContentPart, AiRequest, WebSearchRequest, WebSearchResult } from '../types'
import { AiError } from '../types'

function toBlock(part: AiContentPart): Anthropic.ContentBlockParam {
  return part.type === 'text'
    ? { type: 'text', text: part.text }
    : { type: 'image', source: { type: 'base64', media_type: part.mediaType, data: part.base64 } }
}

export function createClaudeProvider(apiKey: string, model: string): AiProvider {
  const client = new Anthropic({ apiKey })
  // Haiku 4.5 rejects the effort parameter (it only exists on the larger models)
  const supportsEffort = !model.startsWith('claude-haiku')

  return {
    id: 'claude',
    model,
    async webSearch(request: WebSearchRequest): Promise<WebSearchResult> {
      // Haiku only has the basic web search tool; the newer models have the version with dynamic filtering
      const tool = (model.startsWith('claude-haiku')
        ? { type: 'web_search_20250305', name: 'web_search', max_uses: request.maxSearches ?? 4 }
        : { type: 'web_search_20260209', name: 'web_search', max_uses: request.maxSearches ?? 4 }) as Anthropic.ToolUnion

      const messages: Anthropic.MessageParam[] = [{ role: 'user', content: request.prompt }]
      const urls = new Set<string>()
      let text = ''
      let searches = 0
      let inputTokens = 0
      let outputTokens = 0

      try {
        // Server-side tools can pause a long turn; keep going until the model is done
        for (let turn = 0; turn < 4; turn++) {
          const response = await client.messages.create({ model, max_tokens: request.maxTokens ?? 8000, system: request.system, tools: [tool], messages })
          inputTokens += response.usage.input_tokens
          outputTokens += response.usage.output_tokens
          searches += response.usage.server_tool_use?.web_search_requests ?? 0

          for (const block of response.content) {
            if (block.type === 'text') text += block.text
            if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
              for (const hit of block.content) if ('url' in hit) urls.add(hit.url)
            }
          }
          if (response.stop_reason === 'refusal') throw new AiError('Het model heeft dit verzoek geweigerd', false, 'claude')
          if (response.stop_reason !== 'pause_turn') break
          messages.push({ role: 'assistant', content: response.content })
          text = ''
        }
        return { text, urls: [...urls], searches, provider: 'claude', model, inputTokens, outputTokens }
      } catch (error) {
        if (error instanceof AiError) throw error
        if (error instanceof Anthropic.APIError) {
          throw new AiError(`Claude API error ${error.status ?? ''}: ${error.message}`, error.status === 429 || (error.status ?? 0) >= 500, 'claude')
        }
        throw new AiError(error instanceof Error ? error.message : 'Webzoeken mislukt', false, 'claude')
      }
    },
    async generate(request: AiRequest) {
      const outputConfig = supportsEffort || request.jsonSchema
        ? {
            ...(supportsEffort && { effort: request.effort ?? 'medium' }),
            ...(request.jsonSchema && { format: { type: 'json_schema' as const, schema: request.jsonSchema } })
          }
        : undefined

      try {
        const response = await client.messages.create({
          model,
          max_tokens: request.maxTokens ?? 16000,
          system: request.system,
          messages: request.messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : m.content.map(toBlock)
          })),
          ...(outputConfig && { output_config: outputConfig })
        })

        if (response.stop_reason === 'refusal') {
          throw new AiError('Het model heeft dit verzoek geweigerd', false, 'claude')
        }

        const text = response.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('')
        return {
          text,
          json: request.jsonSchema ? JSON.parse(text) : undefined,
          provider: 'claude',
          model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      } catch (error) {
        if (error instanceof AiError) throw error
        if (error instanceof Anthropic.APIError) {
          const retryable = error.status === 429 || (error.status ?? 0) >= 500
          throw new AiError(`Claude API error ${error.status ?? ''}: ${error.message}`, retryable, 'claude')
        }
        if (error instanceof Anthropic.APIConnectionError) {
          throw new AiError('Kon de Claude API niet bereiken', true, 'claude')
        }
        throw new AiError(error instanceof Error ? error.message : 'Onbekende AI-fout', false, 'claude')
      }
    }
  }
}
