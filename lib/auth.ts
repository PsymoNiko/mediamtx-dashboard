export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("mediamtx_auth")
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("mediamtx_username")
}

export function setAuthToken(token: string, username: string) {
  sessionStorage.setItem("mediamtx_auth", token)
  sessionStorage.setItem("mediamtx_username", username)
}

export function clearAuth() {
  sessionStorage.removeItem("mediamtx_auth")
  sessionStorage.removeItem("mediamtx_username")
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}

export function getAuthHeader(): string {
  const token = getAuthToken()
  return token ? `Basic ${token}` : ""
}
