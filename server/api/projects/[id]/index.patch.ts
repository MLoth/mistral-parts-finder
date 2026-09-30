export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  const input = await readValidatedBody(event, projectSchema.parse)
  const body = { ...input, ...(await canonicalCar(input.make, input.model)) }

  await doc.ref.update({ ...body, updatedAt: new Date().toISOString() })
  return toProject(await doc.ref.get(), await loadParts(doc.id))
})
