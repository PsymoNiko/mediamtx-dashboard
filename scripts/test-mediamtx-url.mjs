import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
  normalizeMediaMtxUpstreamApiBaseUrl,
} from "../lib/mediamtx-url.mjs"

assert.equal(normalizeMediaMtxApiBaseUrl(undefined), "/api/mediamtx")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost:9997/"), "http://localhost:9997")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost/v3"), "http://localhost")
assert.equal(normalizeMediaMtxApiBaseUrl("http://localhost/v3/config"), "http://localhost")

process.env.NEXT_PUBLIC_BASE_PATH = "/dashboard/"
assert.equal(normalizeMediaMtxApiBaseUrl(undefined), "/dashboard/api/mediamtx")
assert.equal(buildMediaMtxApiUrl("/v3/config/global/get"), "/dashboard/api/mediamtx/v3/config/global/get")
assert.equal(normalizeMediaMtxApiBaseUrl("/custom/api/"), "/custom/api")
delete process.env.NEXT_PUBLIC_BASE_PATH

assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "/api/mediamtx"),
  "/api/mediamtx/v3/config/global/get",
)
assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "http://localhost/v3/config"),
  "http://localhost/v3/config/global/get",
)
assert.equal(buildMediaMtxHlsUrl("mystream", "http://localhost/hls/"), "http://localhost/hls/mystream/index.m3u8")

assert.equal(normalizeMediaMtxUpstreamApiBaseUrl("http://mediamtx:9997/v3/config"), "http://mediamtx:9997")
assert.equal(normalizeMediaMtxUpstreamApiBaseUrl("/api/mediamtx"), "http://localhost:9997")
assert.equal(normalizeMediaMtxUpstreamApiBaseUrl(""), "http://localhost:9997")

const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
