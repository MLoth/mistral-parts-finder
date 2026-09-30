import { decrypt } from '../../../../../ai/crypto'
import { PROVIDERS, isProviderId } from '../../../../../ai/registry'
import { loadSettings } from '../../../../../ai/settings'
import { AiError } from '../../../../../ai/types'

/** Sends a tiny request with the stored key to check it works. Not logged as usage. */
export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const id = getRouterParam(event, 'id')!
  if (!isProviderId(id)) throw createError({ statusCode: 404, statusMessage: 'Onbekende provider' })

  const stored = (await loadSettings()).providers[id]
  if (!stored) throw createError({ statusCode: 400, statusMessage: 'Geen API-sleutel ingesteld' })

  try {
    const provider = PROVIDERS[id].create(decrypt(stored.apiKeyEnc), stored.model)
    const result = await provider.generate({ feature: 'test', effort: 'low', maxTokens: 1024, messages: [{ role: 'user', content: 'Reply with the single word: OK' }] })
    return { ok: true, model: result.model, reply: result.text.trim() }
  } catch (error) {
    return { ok: false, error: error instanceof AiError ? error.message : 'Test mislukt' }
  }
})
