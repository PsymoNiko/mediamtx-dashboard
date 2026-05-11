import { type NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ path?: string[] }>
}

const DEFAULT_MEDIAMTX_API_URL = "http://localhost:9997"
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

function getMediaMtxApiBaseUrl() {
  const publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL
  const rawUrl =
    process.env.MEDIAMTX_API_URL ||
    (publicApiUrl && /^https?:\/\//i.test(publicApiUrl) ? publicApiUrl : undefined) ||
    DEFAULT_MEDIAMTX_API_URL

  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/v3\/config$/, "")
    .replace(/\/v3$/, "")
}

async function getPath(context: RouteContext) {
  const params = await context.params
  return params.path?.join("/") || ""
}

function getRequestHeaders(request: NextRequest) {
  const headers = new Headers()

  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  return headers
}

function getResponseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers(upstreamHeaders)

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header)
  }

  return headers
}

async function proxyMediaMtxRequest(request: NextRequest, context: RouteContext) {
  const path = await getPath(context)
  const targetUrl = new URL(`/${path}${request.nextUrl.search}`, `${getMediaMtxApiBaseUrl()}/`)
  const init: RequestInit = {
    method: request.method,
    headers: getRequestHeaders(request),
    cache: "no-store",
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer()
  }

  const response = await fetch(targetUrl, init)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: getResponseHeaders(response.headers),
  })
}

export {
  proxyMediaMtxRequest as DELETE,
  proxyMediaMtxRequest as GET,
  proxyMediaMtxRequest as HEAD,
  proxyMediaMtxRequest as PATCH,
  proxyMediaMtxRequest as POST,
  proxyMediaMtxRequest as PUT,
}
