const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

export function normalizeMediaMtxApiBaseUrl(apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const configuredUrl = trimTrailingSlashes((apiUrl || DEFAULT_API_BASE_URL).trim())

  return configuredUrl.replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "") || DEFAULT_API_BASE_URL
}

export function buildMediaMtxApiUrl(endpoint, apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl)}${normalizedEndpoint}`
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
