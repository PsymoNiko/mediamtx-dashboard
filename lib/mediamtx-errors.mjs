export class MediaMtxApiError extends Error {
  constructor(message, status, statusText = "", body = "") {
    super(message)
    this.name = "MediaMtxApiError"
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

export function isMediaMtxAuthError(error) {
  return error instanceof MediaMtxApiError && (error.status === 401 || error.status === 403)
}
