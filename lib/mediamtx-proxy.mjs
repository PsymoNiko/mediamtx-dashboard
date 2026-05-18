const DEFAULT_PROXY_TIMEOUT_MS = 10_000
const MAX_PROXY_TIMEOUT_MS = 120_000

export function parseMediaMtxProxyTimeoutMs(value = process.env.MEDIAMTX_PROXY_TIMEOUT_MS) {
  const parsed = Number.parseInt(String(value || ""), 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PROXY_TIMEOUT_MS
  }

  return Math.min(parsed, MAX_PROXY_TIMEOUT_MS)
}

export function describeMediaMtxUpstream(upstreamUrl) {
  try {
    const parsedUrl = new URL(upstreamUrl)
    parsedUrl.username = ""
    parsedUrl.password = ""
    parsedUrl.pathname = ""
    parsedUrl.search = ""
    parsedUrl.hash = ""

    return parsedUrl.toString().replace(/\/$/, "")
  } catch {
    return "configured MediaMTX API upstream"
  }
}

export function isAbortError(error) {
  return Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError")
}

export function mediaMtxProxyErrorPayload({ error, upstreamUrl }) {
  const timedOut = isAbortError(error)

  return {
    error: timedOut ? "MediaMTX upstream timed out" : "MediaMTX upstream unavailable",
    message: timedOut
      ? "The MediaMTX API did not respond before the dashboard proxy timeout."
      : "The dashboard could not reach the MediaMTX API upstream.",
    upstream: describeMediaMtxUpstream(upstreamUrl),
  }
}
