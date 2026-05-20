const DEFAULT_ALLOWED_HEADERS = ["accept", "authorization", "content-type"]

export const PROXY_ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
export const PROXY_ALLOWED_HEADERS = "Accept, Authorization, Content-Type"
export const PROXY_HEADERS = ["Accept", "Authorization", "Content-Type"]

function parseAllowedOrigins(value) {
  return (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isAllowedOrigin(request, origin, configuredOrigins = process.env.MEDIAMTX_PROXY_ALLOWED_ORIGINS) {
  if (!origin) {
    return true
  }

  const requestOrigin = new URL(request.url).origin
  const allowedOrigins = parseAllowedOrigins(configuredOrigins)

  return origin === requestOrigin || allowedOrigins.includes(origin)
}

function allowedRequestedHeaders(request) {
  const requestedHeaders = request.headers.get("access-control-request-headers")

  if (!requestedHeaders) {
    return PROXY_ALLOWED_HEADERS
  }

  const allowedHeaders = requestedHeaders
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter((header) => DEFAULT_ALLOWED_HEADERS.includes(header))

  return allowedHeaders.length ? allowedHeaders.join(", ") : PROXY_ALLOWED_HEADERS
}

export function corsHeaders(request, configuredOrigins = process.env.MEDIAMTX_PROXY_ALLOWED_ORIGINS) {
  const headers = new Headers()
  const origin = request.headers.get("origin")

  headers.set("vary", "Origin, Access-Control-Request-Headers")

  if (!isAllowedOrigin(request, origin, configuredOrigins)) {
    return headers
  }

  headers.set("access-control-allow-origin", origin || "*")
  headers.set("access-control-allow-methods", PROXY_ALLOWED_METHODS)
  headers.set("access-control-allow-headers", allowedRequestedHeaders(request))
  headers.set("access-control-max-age", "86400")

  return headers
}

export function appendVaryHeader(headers, value) {
  const existingValues = headers.get("vary")?.split(",").map((header) => header.trim()).filter(Boolean) || []
  const nextValues = value.split(",").map((header) => header.trim()).filter(Boolean)

  headers.set("vary", Array.from(new Set([...existingValues, ...nextValues])).join(", "))
}
