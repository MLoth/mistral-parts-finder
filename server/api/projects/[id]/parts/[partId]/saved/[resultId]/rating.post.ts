import { randomUUID } from 'node:crypto'
import type { SavedResult } from '#shared/types/saved'
import { addRating } from '../../../../../../../sourcing/ratings'

/** A colleague rates the source of a saved result as good or bad. Shared company-wide. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { project, part, partDoc } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const doc = await partDoc.ref.collection('saved').doc(getRouterParam(event, 'resultId')!).get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Opgeslagen resultaat niet gevonden' })

  const body = await readValidatedBody(event, ratingSchema.parse)
  await addRating((doc.data() as SavedResult).result, {
    id: randomUUID(),
    at: new Date().toISOString(),
    by: user.name ?? user.email ?? '',
    context: `${project.name} / ${part.name}`,
    ...body
  })
  return { ok: true }
})
