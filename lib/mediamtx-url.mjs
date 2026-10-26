const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_UPSTREAM_API_BASE_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

function stripMediaMtxApiSuffix(value) {
  return trimTrailingSlashes(value).replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "")
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function normalizeMediaMtxApiBaseUrl(apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const configuredUrl = trimTrailingSlashes((apiUrl || DEFAULT_API_BASE_URL).trim())

  return stripMediaMtxApiSuffix(configuredUrl) || DEFAULT_API_BASE_URL
}

export function buildMediaMtxApiUrl(endpoint, apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl)}${normalizedEndpoint}`
}

export function normalizeMediaMtxUpstreamApiBaseUrl({
  mediamtxApiUrl = process.env.MEDIAMTX_API_URL,
  serverPublicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
  publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
} = {}) {
  const configuredUrl = [mediamtxApiUrl, serverPublicApiUrl, publicApiUrl, DEFAULT_UPSTREAM_API_BASE_URL]
    .find((value) => typeof value === "string" && value.trim())
    .trim()

  if (!isHttpUrl(configuredUrl)) {
    return DEFAULT_UPSTREAM_API_BASE_URL
  }

  return stripMediaMtxApiSuffix(configuredUrl)
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
