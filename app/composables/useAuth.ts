import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from 'firebase/auth'

export type Role = 'admin' | 'staff'

export function useAuth() {
  const { $firebaseAuth: auth } = useNuxtApp()

  const user = useState<User | null>('auth-user', () => null)
  const role = useState<Role>('auth-role', () => 'staff')
  const ready = useState('auth-ready', () => false)
  // Firebase's User object is mutated outside Vue's reactivity, so mirror the name here
  const name = useState('auth-name', () => '')

  async function applyUser(next: User | null) {
    user.value = next
    name.value = next?.displayName ?? ''
    role.value = next
      ? ((await next.getIdTokenResult()).claims.role === 'admin' ? 'admin' : 'staff')
      : 'staff'
  }

  /** Resolves once Firebase has restored the session (or found none). */
  function init() {
    if (ready.value) return Promise.resolve()
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (next) => {
        await applyUser(next)
        ready.value = true
        resolve()
      })
    })
  }

  const signInWithEmail = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)

  const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())

  const signOut = () => firebaseSignOut(auth)

  const getToken = () => user.value?.getIdToken()

  /** Name shown in the UI: display name, else the part of the email before the @ */
  const displayName = computed(() => name.value || user.value?.email?.split('@')[0] || '')

  async function updateDisplayName(next: string) {
    if (!user.value) return
    await updateProfile(user.value, { displayName: next })
    name.value = next
    // Refresh the ID token so the server sees the new name
    await user.value.getIdToken(true)
  }

  const canChangePassword = computed(() => !!user.value?.providerData.some(p => p.providerId === 'password'))

  const sendPasswordReset = () => sendPasswordResetEmail(auth, user.value!.email!)

  return {
    user,
    role,
    ready,
    displayName,
    hasDisplayName: computed(() => !!name.value),
    canChangePassword,
    updateDisplayName,
    sendPasswordReset,
    isAdmin: computed(() => role.value === 'admin'),
    init,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getToken
  }
}
