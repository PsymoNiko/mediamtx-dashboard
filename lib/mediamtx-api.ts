import { getAuthHeader } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_MEDIAMTX_API_URL || "http://192.168.50.15:9997"

export interface PathConfig {
  name: string
  source: string
  sourceFingerprint?: string
  sourceOnDemand?: boolean
  sourceOnDemandStartTimeout?: string
  sourceOnDemandCloseAfter?: string
  maxReaders?: number
  record?: boolean
  recordPath?: string
  recordFormat?: string
  recordPartDuration?: string
  recordSegmentDuration?: string
  recordDeleteAfter?: string
  overridePublisher?: boolean
}

export interface PathSource {
  type: string
  id: string
}

export interface PathReader {
  type: string
  id: string
}

export interface Path {
  name: string
  confName: string
  source: PathSource | null
  ready: boolean
  readyTime: string | null
  tracks: string[]
  bytesReceived: number
  bytesSent: number
  readers: PathReader[]
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const authHeader = getAuthHeader()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...options.headers,
    },
  })

  const contentType = response.headers.get("content-type") || ""

  if (!response.ok) {
    let errorText = ""
    try {
      errorText = await response.text()
    } catch {}
    throw new Error(errorText || `API request failed: ${response.status} ${response.statusText}`)
  }

  if (response.status === 204) return null

  // Some MediaMTX endpoints return an empty body on success; avoid JSON parse errors
  const text = await response.text()
  if (!text) return null

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text)
    } catch (e) {
      throw new Error("Invalid JSON in response")
    }
  }

  return text
}

export async function getPathConfigs(): Promise<PathConfig[]> {
  const data = await fetchAPI("/v3/config/paths/list")
  return data.items || []
}

export async function getPaths(): Promise<Path[]> {
  const data = await fetchAPI("/v3/paths/list")
  return data.items || []
}

export async function addPath(config: PathConfig): Promise<void> {
  // Only send the fields that MediaMTX expects
  const payload: any = {
    name: config.name,
    source: config.source,
  }

  // Only add optional fields if they have non-default values
  if (config.sourceFingerprint) {
    payload.sourceFingerprint = config.sourceFingerprint
  }

  if (config.sourceOnDemand !== undefined) {
    payload.sourceOnDemand = config.sourceOnDemand
  }

  if (config.sourceOnDemandStartTimeout) {
    payload.sourceOnDemandStartTimeout = config.sourceOnDemandStartTimeout
  }

  if (config.sourceOnDemandCloseAfter) {
    payload.sourceOnDemandCloseAfter = config.sourceOnDemandCloseAfter
  }

  if (config.maxReaders !== undefined && config.maxReaders !== 0) {
    payload.maxReaders = config.maxReaders
  }

  if (config.record !== undefined) {
    payload.record = config.record
  }

  if (config.record && config.recordPath) {
    payload.recordPath = config.recordPath
  }

  if (config.record && config.recordFormat) {
    payload.recordFormat = config.recordFormat
  }

  if (config.record && config.recordPartDuration) {
    payload.recordPartDuration = config.recordPartDuration
  }

  if (config.record && config.recordSegmentDuration) {
    payload.recordSegmentDuration = config.recordSegmentDuration
  }

  if (config.record && config.recordDeleteAfter) {
    payload.recordDeleteAfter = config.recordDeleteAfter
  }

  if (config.overridePublisher !== undefined) {
    payload.overridePublisher = config.overridePublisher
  }

  await fetchAPI(`/v3/config/paths/add/${encodeURIComponent(config.name)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updatePath(name: string, config: Partial<PathConfig>): Promise<void> {
  await fetchAPI(`/v3/config/paths/patch/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify(config),
  })
}

export async function deletePath(name: string): Promise<void> {
  await fetchAPI(`/v3/config/paths/delete/${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
}

