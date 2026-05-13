const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"
const DEFAULT_UPSTREAM_API_BASE_URL = "http://localhost:9997"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

function normalizeBasePath(basePath = process.env.NEXT_PUBLIC_BASE_PATH) {
  const configuredBasePath = trimTrailingSlashes((basePath || "").trim())

  if (!configuredBasePath || configuredBasePath === "/") {
    return ""
  }

  return configuredBasePath.startsWith("/") ? configuredBasePath : `/${configuredBasePath}`
}

function isAbsoluteHttpUrl(url) {
  return /^https?:\/\//i.test(url)
}

function stripMediaMtxEndpoint(url) {
  return trimTrailingSlashes(url).replace(/\/v3(?:\/.*)?$/i, "")
}

function applyBasePath(url, basePath) {
  const normalizedBasePath = normalizeBasePath(basePath)

  if (!normalizedBasePath || !url.startsWith("/")) {
    return url
  }

  if (url === normalizedBasePath || url.startsWith(`${normalizedBasePath}/`)) {
    return url
  }

  return `${normalizedBasePath}${url}`
}

export function normalizeMediaMtxApiBaseUrl(
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const configuredUrl = stripMediaMtxEndpoint((apiUrl || DEFAULT_API_BASE_URL).trim()) || DEFAULT_API_BASE_URL

  return applyBasePath(configuredUrl, basePath)
}

export function buildMediaMtxApiUrl(
  endpoint,
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl, basePath)}${normalizedEndpoint}`
}

export function normalizeMediaMtxUpstreamApiBaseUrl({
  apiUrl = process.env.MEDIAMTX_API_URL,
  serverApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
  publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
} = {}) {
  for (const candidate of [apiUrl, serverApiUrl, publicApiUrl]) {
    const configuredUrl = (candidate || "").trim()

    if (configuredUrl && isAbsoluteHttpUrl(configuredUrl)) {
      return stripMediaMtxEndpoint(configuredUrl) || DEFAULT_UPSTREAM_API_BASE_URL
    }
  }

  return DEFAULT_UPSTREAM_API_BASE_URL
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
