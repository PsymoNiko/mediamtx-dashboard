const DEFAULT_API_URL = "/api/mediamtx"

export function getMediaMtxApiUrl(endpoint: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_MEDIAMTX_API_URL || DEFAULT_API_URL)
    .replace(/\/+$/, "")
    .replace(/\/v3\/config$/, "")
    .replace(/\/v3$/, "")
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${baseUrl}${path}`
}
