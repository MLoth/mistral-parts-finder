export default defineNuxtRouteMiddleware(async (to) => {
  const { init, user } = useAuth()
  await init()

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
