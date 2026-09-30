import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function useFirebaseApp() {
  const config = useRuntimeConfig()

  return getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: config.public.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n')
    })
  })
}

export const useFirebaseAdmin = () => getAuth(useFirebaseApp())
export const useFirestore = () => getFirestore(useFirebaseApp())
