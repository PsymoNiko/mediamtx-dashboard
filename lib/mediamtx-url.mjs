const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_SERVER_UPSTREAM_API_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

function stripKnownApiSuffixes(value) {
  return value
    .replace(/\/v3\/config\/global\/get$/i, "")
    .replace(/\/v3\/config\/paths\/list$/i, "")
    .replace(/\/v3\/config\/.*$/i, "")
    .replace(/\/v3\/config$/i, "")
    .replace(/\/v3\/.*$/i, "")
    .replace(/\/v3$/i, "")
}

export function getDefaultBrowserApiBaseUrl(basePath = process.env.NEXT_PUBLIC_BASE_PATH) {
  const normalizedBasePath = trimTrailingSlashes((basePath || "").trim())
  if (!normalizedBasePath || normalizedBasePath === "/") {
    return DEFAULT_API_BASE_URL
  }
  const prefixed = normalizedBasePath.startsWith("/")
    ? normalizedBasePath
    : `/${normalizedBasePath}`
  return `${prefixed}${DEFAULT_API_BASE_URL}`
}

export function normalizeMediaMtxApiBaseUrl(
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const fallback = getDefaultBrowserApiBaseUrl(basePath)
  const configuredUrl = trimTrailingSlashes((apiUrl || fallback).trim())
  const stripped = trimTrailingSlashes(stripKnownApiSuffixes(configuredUrl))

  if (!stripped) {
    return fallback
  }

  if (
    stripped === DEFAULT_API_BASE_URL &&
    fallback !== DEFAULT_API_BASE_URL
  ) {
    return fallback
  }

  return stripped
}

export function normalizeServerMediaMtxApiBaseUrl(
  serverApiUrl = process.env.MEDIAMTX_API_URL || process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
  publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
) {
  const candidate = [serverApiUrl, publicApiUrl]
    .map((v) => trimTrailingSlashes((v || "").trim()))
    .find((v) => /^https?:\/\//i.test(v))

  const resolved = candidate || DEFAULT_SERVER_UPSTREAM_API_URL
  return trimTrailingSlashes(stripKnownApiSuffixes(resolved)) || DEFAULT_SERVER_UPSTREAM_API_URL
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
