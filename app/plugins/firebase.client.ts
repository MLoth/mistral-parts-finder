import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const { public: config } = useRuntimeConfig()

  const app = getApps()[0] ?? initializeApp({
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    appId: config.firebaseAppId
  })

  return { provide: { firebaseAuth: getAuth(app) } }
})
