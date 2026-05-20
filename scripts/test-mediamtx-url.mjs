import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
} from "../lib/mediamtx-url.mjs"
import { buildMediaMtxListEndpoint, shouldFetchNextMediaMtxListPage } from "../lib/mediamtx-pagination.mjs"

assert.equal(normalizeMediaMtxApiBaseUrl(undefined), "/api/mediamtx")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost:9997/"), "http://localhost:9997")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost/v3"), "http://localhost")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost/v3/config"), "http://localhost")

assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "/api/mediamtx"),
  "/api/mediamtx/v3/config/global/get",
)
assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "http://localhost/v3/config"),
  "http://localhost/v3/config/global/get",
)
assert.equal(buildMediaMtxHlsUrl("mystream", "http://localhost/hls/"), "http://localhost/hls/mystream/index.m3u8")

assert.equal(buildMediaMtxListEndpoint("/v3/paths/list", 0), "/v3/paths/list?page=0&itemsPerPage=100")
assert.equal(buildMediaMtxListEndpoint("v3/config/paths/list", 2), "/v3/config/paths/list?page=2&itemsPerPage=100")
assert.equal(
  buildMediaMtxListEndpoint("/v3/paths/list?query=cam", 1, 50),
  "/v3/paths/list?query=cam&page=1&itemsPerPage=50",
)
assert.equal(shouldFetchNextMediaMtxListPage({ pageCount: 3 }, 0), true)
assert.equal(shouldFetchNextMediaMtxListPage({ pageCount: 3 }, 2), false)
assert.equal(shouldFetchNextMediaMtxListPage({ items: [] }, 0), false)

const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
