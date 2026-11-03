export function buildMediaMtxRequestHeaders(authHeader, optionsHeaders, hasBody) {
  const headers = new Headers(optionsHeaders)

  if (authHeader) {
    headers.set("Authorization", authHeader)
  }

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return headers
}
