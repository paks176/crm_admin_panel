export const authCheck = () => {
  const token = useCookie('apollo-token', {
    sameSite: 'strict',
    secure: true
  })

  const isAuthenticated = computed(() => !!token.value)

  const login = async (newToken: string) => {
    token.value = newToken
    await navigateTo('/')
  }

  const logout = async () => {
    token.value = ''
    await navigateTo('/login')
  }

  return {
    token,
    isAuthenticated,
    login,
    logout
  }
}
