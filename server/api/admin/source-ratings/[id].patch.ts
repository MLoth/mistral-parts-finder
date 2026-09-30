import { patchRating } from '../../../sourcing/ratings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const body = await readValidatedBody(event, sourceRatingPatchSchema.parse)
  await patchRating(getRouterParam(event, 'id')!, body)
  return { ok: true }
})
