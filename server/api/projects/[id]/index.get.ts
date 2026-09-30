export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  const parts = await loadParts(doc.id)
  return { project: toProject(doc, parts), parts }
})
