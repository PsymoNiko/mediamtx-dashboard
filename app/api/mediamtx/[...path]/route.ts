const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"

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
    headers: responseHeaders(response.headers),
  })
}

export const GET = proxyMediaMtxRequest
export const POST = proxyMediaMtxRequest
export const PUT = proxyMediaMtxRequest
export const PATCH = proxyMediaMtxRequest
export const DELETE = proxyMediaMtxRequest
