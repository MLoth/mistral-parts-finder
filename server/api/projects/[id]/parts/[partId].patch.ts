export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  const ref = doc.ref.collection('parts').doc(getRouterParam(event, 'partId')!)
  if (!(await ref.get()).exists) throw createError({ statusCode: 404, statusMessage: 'Onderdeel niet gevonden' })

  const body = await readValidatedBody(event, partSchema.partial().parse)
  const now = new Date().toISOString()
  await ref.update({ ...body, updatedAt: now })
  await doc.ref.update({ updatedAt: now })
  return toPart(await ref.get())
})
