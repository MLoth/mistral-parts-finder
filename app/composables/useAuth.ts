import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth'

export type Role = 'admin' | 'staff'

export function useAuth() {
  const { $firebaseAuth: auth } = useNuxtApp()

  const user = useState<User | null>('auth-user', () => null)
  const role = useState<Role>('auth-role', () => 'staff')
  const ready = useState('auth-ready', () => false)

  async function applyUser(next: User | null) {
    user.value = next
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

  return {
    user,
    role,
    ready,
    isAdmin: computed(() => role.value === 'admin'),
    init,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getToken
  }
}
