export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await readValidatedBody(event, projectSchema.parse)
  const body = { ...input, ...(await canonicalCar(input.make, input.model)) }
  const now = new Date().toISOString()

  const ref = await projectsCol().add({
    ...body,
    createdBy: user.uid,
    createdByEmail: user.email ?? '',
    createdByName: user.name ?? '',
    createdAt: now,
    updatedAt: now
  })
  return toProject(await ref.get())
})
