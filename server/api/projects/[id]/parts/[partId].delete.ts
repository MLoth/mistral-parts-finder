export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  await doc.ref.collection('parts').doc(getRouterParam(event, 'partId')!).delete()
  await doc.ref.update({ updatedAt: new Date().toISOString() })
  return { ok: true }
})
