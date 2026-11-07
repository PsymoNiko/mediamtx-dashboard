import { normalizeServerMediaMtxApiBaseUrl } from "@/lib/mediamtx-url.mjs"

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

/**
 * Resolve the upstream MediaMTX control API base URL from server environment variables.
 * @returns {string} Normalized upstream HTTP base URL.
 */
function normalizeUpstreamApiUrl() {
  return normalizeServerMediaMtxApiBaseUrl(
    process.env.MEDIAMTX_API_URL || process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
    process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  )
}

/**
 * Extract safe authentication and content negotiation headers from the incoming client request.
 * @param {Request} request - Incoming Next.js route handler request.
 * @returns {Headers} Sanitized headers to forward to the MediaMTX server.
 */
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

/**
 * Strip RFC 2616 hop-by-hop transport headers from the upstream MediaMTX response.
 * @param {Headers} headers - Raw upstream response headers.
 * @returns {Headers} Filtered response headers safe for browser forwarding.
 */
function responseHeaders(headers: Headers) {
  const filteredHeaders = new Headers(headers)

  for (const header of HOP_BY_HOP_HEADERS) {
    filteredHeaders.delete(header)
  }

  return filteredHeaders
}

/**
 * Build a 503 Service Unavailable JSON response when the MediaMTX upstream API is unreachable.
 * @returns {Response} Explicit 503 response for transient upstream startup windows.
 */
function upstreamUnavailableResponse() {
  return new Response(
    JSON.stringify({ error: "MediaMTX upstream API is temporarily unreachable" }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "content-type": "application/json" },
    },
  )
}

/**
 * Proxy an incoming HTTP request to the upstream MediaMTX v3 control API.
 * @param {Request} request - Incoming HTTP request from dashboard client.
 * @param {{ params: Promise<{ path?: string[] }> }} context - Next.js dynamic catch-all route params.
 * @returns {Promise<Response>} Upstream MediaMTX response with hop-by-hop headers removed.
 */
async function proxyMediaMtxRequest(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params
  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), `${normalizeUpstreamApiUrl()}/`)
  const incomingUrl = new URL(request.url)
  upstreamUrl.search = incomingUrl.search

  const method = request.method.toUpperCase()
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers: proxyHeaders(request),
      body,
      cache: "no-store",
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders(response.headers),
    })
  } catch {
    return upstreamUnavailableResponse()
  }
}

export const dynamic = "force-dynamic"

/**
 * Forward HTTP GET requests to the upstream MediaMTX API.
 */
export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxyMediaMtxRequest(request, context)
}

/**
 * Forward HTTP POST requests to the upstream MediaMTX API.
 */
export async function POST(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxyMediaMtxRequest(request, context)
}

/**
 * Forward HTTP PUT requests to the upstream MediaMTX API.
 */
export async function PUT(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxyMediaMtxRequest(request, context)
}

/**
 * Forward HTTP PATCH requests to the upstream MediaMTX API.
 */
export async function PATCH(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxyMediaMtxRequest(request, context)
}

/**
 * Forward HTTP DELETE requests to the upstream MediaMTX API.
 */
export async function DELETE(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxyMediaMtxRequest(request, context)
}
