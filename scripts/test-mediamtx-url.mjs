import assert from "node:assert/strict"
import fs from "node:fs"

import { loginErrorMessageForResponse } from "../lib/mediamtx-login.mjs"
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

assert.equal(loginErrorMessageForResponse(401), "Invalid username or password")
assert.equal(loginErrorMessageForResponse(403), "Invalid username or password")
assert.equal(
  loginErrorMessageForResponse(502),
  "MediaMTX API is unavailable. Wait for Docker services to finish starting, then try again.",
)
assert.equal(
  loginErrorMessageForResponse(504),
  "MediaMTX API is unavailable. Wait for Docker services to finish starting, then try again.",
)
assert.equal(
  loginErrorMessageForResponse(
    502,
    "Bad Gateway",
    JSON.stringify({ message: "The dashboard could not reach the MediaMTX API upstream." }),
  ),
  "The dashboard could not reach the MediaMTX API upstream.",
)

const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const devCompose = fs.readFileSync("docker-compose.dev.yml", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(!devCompose.includes("pull_policy: never"))
assert.ok(devCompose.includes("pull_policy: missing"))
