import { z } from 'zod'

const schema = z.object({
  role: z.enum(['admin', 'staff']).optional(),
  disabled: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const me = await requireUser(event, { admin: true })
  const uid = getRouterParam(event, 'uid')!
  const body = await readValidatedBody(event, schema.parse)

  if (uid === me.uid && (body.role === 'staff' || body.disabled)) {
    throw createError({ statusCode: 400, statusMessage: 'Je kunt jezelf niet degraderen of uitschakelen' })
  }

  const auth = useFirebaseAdmin()
  if (body.role) await auth.setCustomUserClaims(uid, { role: body.role })
  if (body.disabled !== undefined) await auth.updateUser(uid, { disabled: body.disabled })
  // Force existing sessions to re-authenticate so role/disabled changes apply
  await auth.revokeRefreshTokens(uid)

  return toAdminUser(await auth.getUser(uid))
})
