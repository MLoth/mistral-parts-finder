/** $fetch that attaches the signed-in user's Firebase ID token. */
export function useApi() {
  const { getToken } = useAuth()

  return async function api<T>(url: string, options: Parameters<typeof $fetch>[1] = {}) {
    const token = await getToken()
    return $fetch<T>(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` }
    })
  }
}
