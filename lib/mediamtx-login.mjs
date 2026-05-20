export function loginErrorMessageForResponse(status, statusText = "", responseText = "") {
  if (status === 401 || status === 403) {
    return "Invalid username or password"
  }

  const upstreamMessage = parseUpstreamErrorMessage(responseText)
  if (upstreamMessage) {
    return upstreamMessage
  }

  if (status === 404) {
    return "MediaMTX API endpoint was not found. Check the dashboard proxy and API URL configuration."
  }

  if (status === 502 || status === 503 || status === 504) {
    return "MediaMTX API is unavailable. Wait for Docker services to finish starting, then try again."
  }

  if (status >= 500) {
    return "MediaMTX API returned a server error. Check the dashboard and MediaMTX container logs."
  }

  if (status > 0) {
    const suffix = statusText ? ` ${statusText}` : ""
    return `MediaMTX login check failed with HTTP ${status}${suffix}`
  }

  return "Failed to connect to MediaMTX server"
}

function parseUpstreamErrorMessage(responseText) {
  if (!responseText || typeof responseText !== "string") {
    return null
  }

  try {
    const payload = JSON.parse(responseText)

    if (payload && typeof payload === "object" && typeof payload.message === "string") {
      return payload.message
    }
  } catch {
    return null
  }

  return null
}
