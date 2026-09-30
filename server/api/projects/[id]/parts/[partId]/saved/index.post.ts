import type { SavedResult } from '#shared/types/saved'

/** Saves a result from a search to the part. The server copies it from the stored search, never from the client. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { partDoc, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const body = await readValidatedBody(event, saveResultSchema.parse)

  const search = await searches.doc(body.searchId).get()
  const result = toSearch(search).sources?.results.find(r => r.id === body.resultId)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Resultaat niet gevonden' })

  const ref = partDoc.ref.collection('saved').doc(result.id)
  if ((await ref.get()).exists) return { id: ref.id, ...(await ref.get()).data() } as SavedResult

  const saved = { savedAt: new Date().toISOString(), savedBy: user.name ?? user.email ?? '', result, contacts: [] }
  await ref.set(saved)
  return { id: ref.id, ...saved } as SavedResult
})
