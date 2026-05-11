const DEFAULT_PUBLIC_API_URL = "http://localhost:9997"

export function getMediaMtxPublicApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL?.trim()
  return normalizeMediaMtxApiBase(configured || DEFAULT_PUBLIC_API_URL)
}

export function buildMediaMtxApiUrl(endpoint: string): string {
  const baseUrl = getMediaMtxPublicApiUrl()
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${baseUrl}${normalizedEndpoint}`
}

export function normalizeMediaMtxApiBase(url: string): string {
  const withoutTrailingSlash = url.replace(/\/+$/, "")

  if (withoutTrailingSlash.endsWith("/v3/config")) {
    return withoutTrailingSlash.slice(0, -"/v3/config".length)
  }

  if (withoutTrailingSlash.endsWith("/v3")) {
    return withoutTrailingSlash.slice(0, -"/v3".length)
  }

  return withoutTrailingSlash || DEFAULT_PUBLIC_API_URL
}
