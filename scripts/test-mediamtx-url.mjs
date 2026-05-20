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
const localEnv = fs.readFileSync(".env.local", "utf8")
const devCompose = fs.readFileSync("docker-compose.yml", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const loginPage = fs.readFileSync("app/login/page.tsx", "utf8")
const proxyRoute = fs.readFileSync("app/api/mediamtx/[...path]/route.ts", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(localEnv.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=/api/mediamtx"))
assert.ok(!localEnv.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://localhost:9997"))
assert.ok(!devCompose.includes("env_file:"))
assert.ok(devCompose.includes("MEDIAMTX_API_URL: ${MEDIAMTX_API_URL:-http://publisher:9997}"))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(loginPage.includes('buildMediaMtxApiUrl("/v3/config/global/get")'))
assert.ok(!loginPage.includes("http://localhost:9997"))
assert.ok(!proxyRoute.includes("process.env.NEXT_PUBLIC_MEDIAMTX_API_URL"))
assert.ok(!proxyRoute.includes("process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL"))
