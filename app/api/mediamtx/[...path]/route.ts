const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"
const PROXY_ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
const PROXY_ALLOWED_HEADERS = "Authorization, Content-Type"

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

function normalizeUpstreamApiUrl() {
  const configuredUrl =
    process.env.MEDIAMTX_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_API_URL ||
    DEFAULT_UPSTREAM_API_URL

  return configuredUrl.trim().replace(/\/+$/, "").replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "")
}

function proxyHeaders(request: Request) {
  const headers = new Headers()

  for (const header of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(header)
    if (value) {
      headers.set(header, value)
    }
  }

  return headers
}

function responseHeaders(headers: Headers) {
  const responseHeaders = new Headers(headers)

  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header)
  }

  return responseHeaders
}

function corsHeaders(request: Request) {
  const headers = new Headers()
  const origin = request.headers.get("origin")
  const requestedHeaders = request.headers.get("access-control-request-headers")

  headers.set("Access-Control-Allow-Origin", origin || "*")
  headers.set("Access-Control-Allow-Methods", PROXY_ALLOWED_METHODS)
  headers.set("Access-Control-Allow-Headers", requestedHeaders || PROXY_ALLOWED_HEADERS)
  headers.set("Access-Control-Max-Age", "86400")
  headers.set("Vary", "Origin, Access-Control-Request-Headers")

  return headers
}

function appendVaryHeader(headers: Headers, value: string) {
  const existingValues = headers.get("Vary")?.split(",").map((header) => header.trim()).filter(Boolean) || []
  const nextValues = value.split(",").map((header) => header.trim()).filter(Boolean)

  headers.set("Vary", Array.from(new Set([...existingValues, ...nextValues])).join(", "))
}

function withCorsHeaders(headers: Headers, request: Request) {
  const nextHeaders = new Headers(headers)
  const corsResponseHeaders = corsHeaders(request)
  const varyHeader = corsResponseHeaders.get("Vary")

  corsResponseHeaders.delete("Vary")

  for (const [header, value] of corsResponseHeaders) {
    nextHeaders.set(header, value)
  }

  if (varyHeader) {
    appendVaryHeader(nextHeaders, varyHeader)
  }

  return nextHeaders
}

async function proxyMediaMtxRequest(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params
  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), `${normalizeUpstreamApiUrl()}/`)
  const incomingUrl = new URL(request.url)
  upstreamUrl.search = incomingUrl.search

  const method = request.method.toUpperCase()
  const response = await fetch(upstreamUrl, {
    method,
    headers: proxyHeaders(request),
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: withCorsHeaders(responseHeaders(response.headers), request),
  })
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  })
}

export const GET = proxyMediaMtxRequest
export const HEAD = proxyMediaMtxRequest
export const POST = proxyMediaMtxRequest
export const PUT = proxyMediaMtxRequest
export const PATCH = proxyMediaMtxRequest
export const DELETE = proxyMediaMtxRequest
