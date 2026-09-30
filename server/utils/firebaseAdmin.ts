import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export function useFirebaseAdmin() {
  const config = useRuntimeConfig()

  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: config.public.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n')
    })
  })

  return getAuth(app)
}
