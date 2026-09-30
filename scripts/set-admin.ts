// Usage: bun --env-file=.env scripts/set-admin.ts user@example.com
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const email = process.argv[2]
if (!email) {
  console.error('Usage: bun --env-file=.env scripts/set-admin.ts <email>')
  process.exit(1)
}

const auth = getAuth(initializeApp({
  credential: cert({
    projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.NUXT_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.NUXT_FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  })
}))

const user = await auth.getUserByEmail(email)
await auth.setCustomUserClaims(user.uid, { role: 'admin' })
await auth.revokeRefreshTokens(user.uid)
console.log(`${email} is now an admin. They must sign in again.`)
