import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, AiContentPart, AiRequest } from '../types'
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
