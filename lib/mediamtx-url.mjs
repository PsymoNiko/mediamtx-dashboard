const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

function normalizeBasePath(basePath = process.env.NEXT_PUBLIC_BASE_PATH) {
  const configuredBasePath = trimTrailingSlashes((basePath || "").trim())

  if (!configuredBasePath) {
    return ""
  }

  return configuredBasePath.startsWith("/") ? configuredBasePath : `/${configuredBasePath}`
}

function isAbsoluteHttpUrl(value) {
  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeApiSuffix(value) {
  return trimTrailingSlashes(value).replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "")
}

export function normalizeMediaMtxApiBaseUrl(apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const defaultApiBaseUrl = `${normalizeBasePath()}${DEFAULT_API_BASE_URL}`
  const configuredUrl = normalizeApiSuffix((apiUrl || defaultApiBaseUrl).trim())

  return configuredUrl || defaultApiBaseUrl
}

export function buildMediaMtxApiUrl(endpoint, apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl)}${normalizedEndpoint}`
}

export function normalizeMediaMtxUpstreamApiBaseUrl(
  apiUrl = process.env.MEDIAMTX_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
) {
  const configuredUrl = (apiUrl || "").trim()
  const upstreamUrl = isAbsoluteHttpUrl(configuredUrl) ? configuredUrl : DEFAULT_UPSTREAM_API_URL

  return normalizeApiSuffix(upstreamUrl)
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
