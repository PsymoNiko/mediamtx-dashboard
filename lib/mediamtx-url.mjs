const DEFAULT_API_BASE_URL = "/api/mediamtx"
const DEFAULT_UPSTREAM_API_URL = "http://localhost:9997"
const DEFAULT_HLS_BASE_URL = "http://localhost:8888"

/**
 * Removes trailing slashes from a URL or path string.
 *
 * @param {string} value - Raw URL or path string.
 * @returns {string} The value without trailing slashes.
 */
function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "")
}

/**
 * Strips known MediaMTX v3 endpoint suffixes from a base URL.
 *
 * @param {string} value - Configured MediaMTX URL.
 * @returns {string} The base URL with endpoint suffixes removed.
 */
function stripMediaMtxApiEndpoint(value) {
  return value
    .replace(/\/v3\/config\/global\/get$/i, "")
    .replace(/\/v3\/config$/i, "")
    .replace(/\/v3$/i, "")
}

/**
 * Checks whether a string is an absolute HTTP or HTTPS URL.
 *
 * @param {string} value - Candidate URL string.
 * @returns {boolean} True when the value starts with http:// or https://.
 */
function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(value)
}

/**
 * Normalizes the client-facing MediaMTX API base URL or proxy path.
 *
 * @param {string} [apiUrl] - Configured public API URL.
 * @returns {string} Normalized base URL or default proxy path.
 */
export function normalizeMediaMtxApiBaseUrl(apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const configuredUrl = trimTrailingSlashes((apiUrl || DEFAULT_API_BASE_URL).trim())

  return stripMediaMtxApiEndpoint(configuredUrl) || DEFAULT_API_BASE_URL
}

/**
 * Resolves and normalizes the server-side upstream MediaMTX API base URL used by the Next.js proxy route.
 *
 * @param {object} [options] - Candidate environment URLs.
 * @param {string} [options.serverApiUrl] - Server-only MediaMTX upstream URL.
 * @param {string} [options.legacyServerApiUrl] - Legacy server API environment variable.
 * @param {string} [options.publicApiUrl] - Public MediaMTX API URL fallback when absolute.
 * @returns {string} Normalized absolute upstream base URL.
 */
export function normalizeMediaMtxServerApiBaseUrl({
  serverApiUrl = process.env.MEDIAMTX_API_URL,
  legacyServerApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL,
  publicApiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL,
} = {}) {
  const candidates = [serverApiUrl, legacyServerApiUrl, publicApiUrl].filter(Boolean).map((value) => value.trim())
  const configuredUrl = candidates.find(isAbsoluteHttpUrl) || DEFAULT_UPSTREAM_API_URL

  return stripMediaMtxApiEndpoint(trimTrailingSlashes(configuredUrl)) || DEFAULT_UPSTREAM_API_URL
}

/**
 * Builds a complete MediaMTX API request URL for the given endpoint path.
 *
 * @param {string} endpoint - API endpoint path (for example `/v3/config/global/get`).
 * @param {string} [apiUrl] - Optional base API URL override.
 * @returns {string} Complete MediaMTX API URL.
 */
export function buildMediaMtxApiUrl(endpoint, apiUrl = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${normalizeMediaMtxApiBaseUrl(apiUrl)}${normalizedEndpoint}`
}

/**
 * Normalizes the base URL used for HLS playback streams.
 *
 * @param {string} [hlsUrl] - Configured public HLS base URL.
 * @returns {string} Normalized HLS base URL without trailing slashes.
 */
export function normalizeMediaMtxHlsBaseUrl(hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  return trimTrailingSlashes((hlsUrl || DEFAULT_HLS_BASE_URL).trim())
}

/**
 * Builds the HLS playlist URL (`index.m3u8`) for a stream path.
 *
 * @param {string} pathName - MediaMTX stream path name.
 * @param {string} [hlsUrl] - Optional HLS base URL override.
 * @returns {string} Complete HLS playlist URL.
 */
export function buildMediaMtxHlsUrl(pathName, hlsUrl = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_URL) {
  const normalizedPathName = pathName.replace(/^\/+/, "")

  return `${normalizeMediaMtxHlsBaseUrl(hlsUrl)}/${normalizedPathName}/index.m3u8`
}

/**
 * Performs an upstream MediaMTX fetch with brief startup retries so requests wait cleanly
 * while the scratch-based `bluenviron/mediamtx` container brings up port 9997.
 *
 * @param {string | URL} url - Upstream MediaMTX URL.
 * @param {RequestInit} init - Fetch request options.
 * @param {object} [retryOptions] - Retry configuration.
 * @param {typeof fetch} [retryOptions.fetchImpl] - Fetch implementation override for testing.
 * @param {number} [retryOptions.maxAttempts] - Maximum connection attempts before failing.
 * @param {number} [retryOptions.retryDelayMs] - Base delay in milliseconds between retries.
 * @returns {Promise<Response>} The upstream HTTP response.
 */
export async function fetchUpstreamMediaMtxWithRetry(
  url,
  init,
  { fetchImpl = fetch, maxAttempts = 5, retryDelayMs = 250 } = {},
) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchImpl(url, init)
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts && retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt))
      }
    }
  }
  throw lastError
}
