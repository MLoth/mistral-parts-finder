export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const snap = await searches.orderBy('createdAt', 'desc').get()
  return snap.docs.map(toSearch)
})
