const DEFAULT_MEDIAMTX_API_URL = "http://localhost:9997"

export function getMediaMtxApiBaseUrl(): string {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_MEDIAMTX_API_URL || DEFAULT_MEDIAMTX_API_URL)
}

export function buildMediaMtxApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const baseUrl = getMediaMtxApiBaseUrl()

  if (baseUrl.endsWith("/v3/config") && normalizedEndpoint.startsWith("/v3/config/")) {
    return `${baseUrl}${normalizedEndpoint.slice("/v3/config".length)}`
  }

  if (baseUrl.endsWith("/v3") && normalizedEndpoint.startsWith("/v3/")) {
    return `${baseUrl}${normalizedEndpoint.slice("/v3".length)}`
  }

  return `${baseUrl}${normalizedEndpoint}`
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}
