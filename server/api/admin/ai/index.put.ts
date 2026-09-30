import { z } from 'zod'
import { loadSettings, saveSettings } from '../../../ai/settings'

const schema = z.object({
  defaultProvider: z.enum(['claude']).nullable().optional(),
  fallbackEnabled: z.boolean().optional(),
  monthlyLimitUsd: z.number().positive().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const body = await readValidatedBody(event, schema.parse)
  if (body.defaultProvider && !(await loadSettings()).providers[body.defaultProvider]) {
    throw createError({ statusCode: 400, statusMessage: 'Add an API key for this provider first' })
  }
  await saveSettings(body)
  return { ok: true }
})
