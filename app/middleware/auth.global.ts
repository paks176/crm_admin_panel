import { authCheck } from "~/utils/authCheck";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated } = authCheck()

  if (to.path === '/login') {
    to.meta.layout = 'no-auth-layout'
    return
  } else to.meta.layout = 'auth-layout'

  if (!isAuthenticated.value) {
    to.meta.layout = 'no-auth-layout'
    return navigateTo('/login');
  }
})
