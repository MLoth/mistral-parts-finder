export default defineEventHandler(async (event) => {
  await requireUser(event)
  return loadCatalog()
})
