import type { H3Event } from 'h3'

export type SessionUser = { uid: string, email?: string, role: 'admin' | 'staff' }

/** Verifies the Firebase ID token in the Authorization header. Use in every protected route. */
export async function requireUser(event: H3Event, opts: { admin?: boolean } = {}): Promise<SessionUser> {
  const header = getHeader(event, 'authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  try {
    const decoded = await useFirebaseAdmin().verifyIdToken(token)
    const user: SessionUser = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role === 'admin' ? 'admin' : 'staff'
    }
    if (opts.admin && user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    return user
  } catch (error) {
    if (typeof error === 'object' && error && 'statusCode' in error) throw error
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
