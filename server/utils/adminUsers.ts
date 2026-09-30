import type { UserRecord } from 'firebase-admin/auth'

export type AdminUser = {
  uid: string
  email: string
  name: string
  role: 'admin' | 'staff'
  disabled: boolean
  lastSignIn: string | null
}

export function toAdminUser(user: UserRecord): AdminUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? '',
    role: user.customClaims?.role === 'admin' ? 'admin' : 'staff',
    disabled: user.disabled,
    lastSignIn: user.metadata.lastSignInTime ?? null
  }
}
