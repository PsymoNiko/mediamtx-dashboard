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

const PROXY_RETRY_DELAYS_MS = [200, 500, 1000, 2000]

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

async function fetchWithStartupRetry(url: URL, init: RequestInit) {
  let lastError: unknown

  for (let attempt = 0; attempt <= PROXY_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fetch(url, init)
    } catch (error) {
      lastError = error

      if (attempt === PROXY_RETRY_DELAYS_MS.length) {
        break
      }

      await wait(PROXY_RETRY_DELAYS_MS[attempt])
    }
  }

  console.error("[mediamtx] Upstream API request failed", lastError)

  return new Response("MediaMTX API is not available yet", {
    status: 503,
    statusText: "Service Unavailable",
  })
}

async function proxyMediaMtxRequest(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params
  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), `${normalizeMediaMtxUpstreamApiBaseUrl()}/`)
  const incomingUrl = new URL(request.url)
  upstreamUrl.search = incomingUrl.search

  const method = request.method.toUpperCase()
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()
  const response = await fetchWithStartupRetry(upstreamUrl, {
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
}

export const GET = proxyMediaMtxRequest
export const POST = proxyMediaMtxRequest
export const PUT = proxyMediaMtxRequest
export const PATCH = proxyMediaMtxRequest
export const DELETE = proxyMediaMtxRequest
