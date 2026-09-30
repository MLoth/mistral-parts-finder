export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { partDoc } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  await partDoc.ref.collection('saved').doc(getRouterParam(event, 'resultId')!).delete()
  return { ok: true }
})
