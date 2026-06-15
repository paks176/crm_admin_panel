import {authCheck} from "~/utils/authCheck";

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = authCheck()

  if (to.path === '/login') {
    return
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
