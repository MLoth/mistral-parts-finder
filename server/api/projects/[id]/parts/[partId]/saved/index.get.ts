import type { SavedResult } from '#shared/types/saved'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { partDoc } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const snap = await partDoc.ref.collection('saved').orderBy('savedAt', 'desc').get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SavedResult)
})
