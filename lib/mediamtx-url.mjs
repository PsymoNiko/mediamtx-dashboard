const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_SERVER_UPSTREAM_API_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

/**
 * Remove trailing forward slashes from a URL or path string.
 * @param {string} value - Raw URL or path segment.
 * @returns {string} Path without trailing slashes.
 */
function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

/**
 * Strip accidentally appended MediaMTX v3 REST endpoint suffixes from a base URL.
 * @param {string} value - Candidate base URL string.
 * @returns {string} Base URL without /v3 or /v3/config suffixes.
 */
function stripKnownApiSuffixes(value) {
  return value
    .replace(/\/v3\/config\/global\/get$/i, "")
    .replace(/\/v3\/config\/paths\/list$/i, "")
    .replace(/\/v3\/config\/.*$/i, "")
    .replace(/\/v3\/config$/i, "")
    .replace(/\/v3\/.*$/i, "")
    .replace(/\/v3$/i, "")
}

/**
 * Compute the default browser-side MediaMTX proxy path respecting Next.js basePath.
 * @param {string} [basePath] - Configured NEXT_PUBLIC_BASE_PATH value.
 * @returns {string} Browser-accessible proxy base path.
 */
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

/**
 * Normalize a client-side or custom MediaMTX API base URL and apply basePath fallback.
 * @param {string} [apiUrl] - Configured client API URL override.
 * @param {string} [basePath] - Configured Next.js basePath prefix.
 * @returns {string} Normalized base URL without trailing slashes or v3 suffixes.
 */
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

/**
 * Resolve the upstream server-to-server MediaMTX HTTP base URL for Next.js API route proxying.
 * @param {string} [serverApiUrl] - Internal container/server MediaMTX URL.
 * @param {string} [publicApiUrl] - Publicly configured API URL fallback.
 * @returns {string} Absolute HTTP/HTTPS upstream MediaMTX server URL.
 */
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

/**
 * Construct a complete MediaMTX API endpoint URL from a relative path and base configuration.
 * @param {string} endpoint - Relative MediaMTX API endpoint path (e.g. /v3/config/global/get).
 * @param {string} [apiUrl] - Optional API base URL override.
 * @param {string} [basePath] - Optional Next.js basePath prefix.
 * @returns {string} Full request URL targeting the MediaMTX proxy or server.
 */
export function buildMediaMtxApiUrl(
  endpoint,
  apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl, basePath)}${normalizedEndpoint}`
}

/**
 * Normalize the base URL used for HLS stream playback.
 * @param {string} [hlsUrl] - Configured HLS server URL.
 * @returns {string} Normalized HLS base URL without trailing slashes.
 */
export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

/**
 * Build the HLS playlist (.m3u8) URL for a given MediaMTX stream path name.
 * @param {string} pathName - MediaMTX stream path identifier.
 * @param {string} [hlsUrl] - Optional HLS base URL override.
 * @returns {string} Complete HLS index.m3u8 stream URL.
 */
export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}
