import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
} from "../lib/mediamtx-url.mjs"

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

const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const debianDockerfile = fs.readFileSync("Dockerfile.debian", "utf8")
const prodDockerfile = fs.readFileSync("Dockerfile.prod", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodDockerfile.includes("192.168.50.11"))
assert.match(prodDockerfile, /ARG NEXT_PUBLIC_MEDIAMTX_HLS_URL="http:\/\/localhost:80\/hls"/)
assert.ok(!debianDockerfile.includes('NEXT_PUBLIC_MEDIAMTX_HLS_URL="http://localhost:8888"'))
assert.equal(
  (debianDockerfile.match(/NEXT_PUBLIC_MEDIAMTX_HLS_URL="http:\/\/localhost:8888\/hls"/g) || []).length,
  2,
)
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_HLS_URL=${NEXT_PUBLIC_MEDIAMTX_HLS_URL:-http://localhost:8888}"))
assert.equal(
  (prodCompose.match(/NEXT_PUBLIC_MEDIAMTX_HLS_URL=\$\{NEXT_PUBLIC_MEDIAMTX_HLS_URL:-http:\/\/localhost:8888\/hls\}/g) || [])
    .length,
  2,
)
