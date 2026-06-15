export const authCheck = () => {
  const token = useCookie('apollo_token', {
    maxAge: 60 * 60 * 24 * 7, // 1 неделя
    sameSite: 'strict',
    secure: true,
    httpOnly: true
  })

  const isAuthenticated = !!token.value

  const login = (newToken: string) => {
    token.value = newToken
  }

  const logout = () => {
    token.value = null
  }

  return {
    token,
    isAuthenticated,
    login,
    logout
  }
}
