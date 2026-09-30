import { listRatings } from '../../../sourcing/ratings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  return listRatings()
})
