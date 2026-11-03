const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

export function normalizeMediaMtxApiBaseUrl(apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const configuredUrl = trimTrailingSlashes((apiUrl || DEFAULT_API_BASE_URL).trim())

  return stripMediaMtxApiEndpoint(configuredUrl) || DEFAULT_API_BASE_URL
}

function stripMediaMtxApiEndpoint(value) {
  return value
    .replace(/\/v3\/config\/global\/get$/i, "")
    .replace(/\/v3\/config$/i, "")
    .replace(/\/v3$/i, "")
}

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(value)
}

export function normalizeMediaMtxServerApiBaseUrl({
  serverApiUrl = process.env.MEDIAMTX_API_URL,
  legacyServerApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
  publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
} = {}) {
  const candidates = [serverApiUrl, legacyServerApiUrl, publicApiUrl].filter(Boolean).map((value) => value.trim())
  const configuredUrl = candidates.find(isAbsoluteHttpUrl) || DEFAULT_UPSTREAM_API_URL

  return stripMediaMtxApiEndpoint(trimTrailingSlashes(configuredUrl)) || DEFAULT_UPSTREAM_API_URL
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
