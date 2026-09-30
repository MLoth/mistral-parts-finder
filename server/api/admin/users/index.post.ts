import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'staff']).default('staff')
})

/** Creates an account without a password and returns a link the new user uses to set one. */
export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const body = await readValidatedBody(event, schema.parse)
  const auth = useFirebaseAdmin()

  try {
    const user = await auth.createUser({ email: body.email })
    await auth.setCustomUserClaims(user.uid, { role: body.role })
    const setPasswordLink = await auth.generatePasswordResetLink(body.email)
    return { user: toAdminUser(await auth.getUser(user.uid)), setPasswordLink }
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/email-already-exists') {
      throw createError({ statusCode: 409, statusMessage: 'Er bestaat al een gebruiker met dit e-mailadres' })
    }
    throw error
  }
})
