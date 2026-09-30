import { z } from 'zod'
import { SOURCES } from '../../../sourcing/registry'
import { setSourceEnabled } from '../../../sourcing/settings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const id = getRouterParam(event, 'id')!
  if (!SOURCES.some(s => s.id === id)) throw createError({ statusCode: 404, statusMessage: 'Onbekende bron' })
  const { enabled } = await readValidatedBody(event, z.object({ enabled: z.boolean() }).parse)
  await setSourceEnabled(id, enabled)
  return { ok: true }
})
