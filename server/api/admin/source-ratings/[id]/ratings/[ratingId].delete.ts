import { deleteRating } from '../../../../../sourcing/ratings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  await deleteRating(getRouterParam(event, 'id')!, getRouterParam(event, 'ratingId')!)
  return { ok: true }
})
