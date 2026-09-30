export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const { users } = await useFirebaseAdmin().listUsers(1000)
  return users.map(toAdminUser).sort((a, b) => a.email.localeCompare(b.email))
})
