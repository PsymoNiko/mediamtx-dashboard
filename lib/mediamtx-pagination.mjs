export const DEFAULT_MEDIAMTX_ITEMS_PER_PAGE = 100

export function buildMediaMtxListEndpoint(endpoint, page, itemsPerPage = DEFAULT_MEDIAMTX_ITEMS_PER_PAGE) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const separator = normalizedEndpoint.includes("?") ? "&" : "?"

  return `${normalizedEndpoint}${separator}page=${page}&itemsPerPage=${itemsPerPage}`
}

export function shouldFetchNextMediaMtxListPage(response, page) {
  if (!response || typeof response.pageCount !== "number" || !Number.isFinite(response.pageCount)) {
    return false
  }

  return page + 1 < response.pageCount
}
