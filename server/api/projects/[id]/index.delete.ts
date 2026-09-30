/** Only the creator or an admin can delete a project. Its parts are deleted too. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)

  if (user.role !== 'admin' && doc.data()!.createdBy !== user.uid) {
    throw createError({ statusCode: 403, statusMessage: 'Alleen de maker of een beheerder kan dit project verwijderen' })
  }
  await useFirestore().recursiveDelete(doc.ref)
  return { ok: true }
})
