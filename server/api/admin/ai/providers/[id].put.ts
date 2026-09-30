import { z } from 'zod'
import { encrypt } from '../../../../ai/crypto'
import { PROVIDERS, isProviderId } from '../../../../ai/registry'
import { loadSettings, saveProvider, saveSettings } from '../../../../ai/settings'

const schema = z.object({
  /** Omit to keep the current key and only change the model */
  apiKey: z.string().trim().min(10).optional(),
  model: z.string()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, { admin: true })
  const id = getRouterParam(event, 'id')!
  if (!isProviderId(id)) throw createError({ statusCode: 404, statusMessage: 'Unknown provider' })

  const body = await readValidatedBody(event, schema.parse)
  if (!PROVIDERS[id].models.some(m => m.id === body.model)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown model' })
  }

  const settings = await loadSettings()
  const existing = settings.providers[id]
  if (!body.apiKey && !existing) throw createError({ statusCode: 400, statusMessage: 'An API key is required' })

  await saveProvider(id, {
    apiKeyEnc: body.apiKey ? encrypt(body.apiKey) : existing!.apiKeyEnc,
    keyLast4: body.apiKey ? body.apiKey.slice(-4) : existing!.keyLast4,
    model: body.model,
    updatedAt: new Date().toISOString(),
    updatedBy: user.email ?? user.uid
  })
  // The first provider added becomes the default
  if (!settings.defaultProvider) await saveSettings({ defaultProvider: id })
  return { ok: true }
})
