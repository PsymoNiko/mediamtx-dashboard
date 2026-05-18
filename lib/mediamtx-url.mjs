const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

function normalizeBasePath(basePath = process.env.NEXT_PUBLIC_BASE_PATH) {
  const normalizedBasePath = trimTrailingSlashes((basePath || "").trim())

  return normalizedBasePath ? `/${normalizedBasePath.replace(/^\/+/, "")}` : ""
}

function defaultApiBaseUrl(basePath) {
  return `${normalizeBasePath(basePath)}${DEFAULT_API_BASE_URL}`
}

export function normalizeMediaMtxApiBaseUrl(
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const fallbackApiUrl = defaultApiBaseUrl(basePath)
  const configuredUrl = trimTrailingSlashes((apiUrl || fallbackApiUrl).trim())

  return configuredUrl.replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "") || fallbackApiUrl
}

export function buildMediaMtxApiUrl(
  endpoint,
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl, basePath)}${normalizedEndpoint}`
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
