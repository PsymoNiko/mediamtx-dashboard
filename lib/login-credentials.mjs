export function buildLoginCredentialAttempts(username, password) {
  const attempts = [{ username, password }]
  const trimmedUsername = username.trim()
  const trimmedPassword = password.trim()

  if (trimmedUsername !== username || trimmedPassword !== password) {
    attempts.push({ username: trimmedUsername, password: trimmedPassword })
  }

  return attempts
}
