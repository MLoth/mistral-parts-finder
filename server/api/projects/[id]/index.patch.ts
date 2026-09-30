export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  const body = await readValidatedBody(event, projectSchema.parse)

  await doc.ref.update({ ...body, updatedAt: new Date().toISOString() })
  return toProject(await doc.ref.get(), await loadParts(doc.id))
})
