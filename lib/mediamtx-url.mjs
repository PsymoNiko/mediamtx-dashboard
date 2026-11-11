export const DEFAULT_API_BASE_URL = "/api/mediamtx"
export const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"
export const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

function trimTrailingSlashes(value) {
  return String(value || "").replace(/\/+$/, "")
}

function stripMediaMtxV3Suffix(value) {
  return value
    .replace(/\/v3(?:\/.*)?$/i, "")
    .replace(/\/+$/, "")
}

export function normalizeBasePath(basePath = process.env.NEXT_PUBLIC_BASE_PATH) {
  const trimmed = trimTrailingSlashes((basePath || "").trim())
  if (!trimmed || trimmed === "/") {
    return ""
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export function normalizeMediaMtxApiBaseUrl(
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const normalizedBase = normalizeBasePath(basePath)
  const raw = trimTrailingSlashes((apiUrl || DEFAULT_API_BASE_URL).trim())
  const stripped = stripMediaMtxV3Suffix(raw) || DEFAULT_API_BASE_URL

  if (stripped.startsWith("/") && normalizedBase && !stripped.startsWith(`${normalizedBase}/`) && stripped !== normalizedBase) {
    return `${normalizedBase}${stripped}`
  }
  return stripped
}

export function normalizeMediaMtxUpstreamApiBaseUrl(env = process.env) {
  const candidates = [
    env?.MEDIAMTX_API_URL,
    env?.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
    env?.NEXT_PUBLIC_MEDIAMTX_API_URL,
  ]

  for (const candidate of candidates) {
    const trimmed = trimTrailingSlashes((candidate || "").trim())
    if (!trimmed || trimmed.startsWith("/")) {
      continue
    }
    if (/^https?:\/\//i.test(trimmed)) {
      const stripped = stripMediaMtxV3Suffix(trimmed)
      if (stripped) {
        return stripped
      }
    }
  }

  return DEFAULT_UPSTREAM_API_URL
}

export function buildMediaMtxApiUrl(
  endpoint,
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const normalizedEndpoint = String(endpoint || "").startsWith("/") ? endpoint : `/${endpoint}`
  return `${normalizeMediaMtxApiBaseUrl(apiUrl, basePath)}${normalizedEndpoint}`
}

export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const encodedPathName = String(pathName || "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${encodedPathName}/index.m3u8`
}
