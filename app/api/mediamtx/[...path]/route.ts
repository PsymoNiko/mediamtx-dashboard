import { normalizeMediaMtxUpstreamApiBaseUrl } from "@/lib/mediamtx-url.mjs"

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

const ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
const ALLOWED_HEADERS = "Accept, Authorization, Content-Type"
const UPSTREAM_TIMEOUT_MS = 10_000

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

function responseHeaders(headers?: Headers) {
  const out = new Headers(headers)

  for (const header of HOP_BY_HOP_HEADERS) {
    out.delete(header)
  }

  out.set("Access-Control-Allow-Origin", "*")
  out.set("Access-Control-Allow-Methods", ALLOWED_METHODS)
  out.set("Access-Control-Allow-Headers", ALLOWED_HEADERS)
  return out
}

async function proxyMediaMtxRequest(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const method = request.method.toUpperCase()
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(),
    })
  }

  const { path = [] } = await context.params
  const upstreamBase = normalizeMediaMtxUpstreamApiBaseUrl(process.env)
  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), `${upstreamBase}/`)
  const incomingUrl = new URL(request.url)
  upstreamUrl.search = incomingUrl.search

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers: proxyHeaders(request),
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      signal: controller.signal,
    })

    return new Response(method === "HEAD" ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders(response.headers),
    })
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError"
    return Response.json(
      {
        error: isTimeout ? "MediaMTX upstream request timed out" : "Failed to reach MediaMTX upstream API",
        upstream: upstreamBase,
      },
      {
        status: isTimeout ? 504 : 502,
        headers: responseHeaders(),
      },
    )
  } finally {
    clearTimeout(timer)
  }
}

export const GET = proxyMediaMtxRequest
export const HEAD = proxyMediaMtxRequest
export const POST = proxyMediaMtxRequest
export const PUT = proxyMediaMtxRequest
export const PATCH = proxyMediaMtxRequest
export const DELETE = proxyMediaMtxRequest
export const OPTIONS = proxyMediaMtxRequest
