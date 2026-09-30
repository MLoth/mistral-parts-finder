import type { SavedResult } from '#shared/types/saved'
import { ratingsFor, sourceIdentity, summaryFor } from '../../../../../../sourcing/ratings'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { partDoc } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const snap = await partDoc.ref.collection('saved').orderBy('savedAt', 'desc').get()
  const saved = snap.docs.map(d => ({ id: d.id, ...d.data() }) as SavedResult)

  const ratings = await ratingsFor(saved.map(s => sourceIdentity(s.result).id))
  return saved.map(s => ({ ...s, sourceKey: sourceIdentity(s.result).key, sourceRating: summaryFor(ratings, s.result) }))
})
