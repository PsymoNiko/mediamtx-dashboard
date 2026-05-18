import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
} from "../lib/mediamtx-url.mjs"
import {
  describeMediaMtxUpstream,
  mediaMtxProxyErrorPayload,
  parseMediaMtxProxyTimeoutMs,
} from "../lib/mediamtx-proxy.mjs"

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

assert.equal(parseMediaMtxProxyTimeoutMs(undefined), 10_000)
assert.equal(parseMediaMtxProxyTimeoutMs("2500"), 2500)
assert.equal(parseMediaMtxProxyTimeoutMs("-1"), 10_000)
assert.equal(parseMediaMtxProxyTimeoutMs("999999"), 120_000)

assert.equal(
  describeMediaMtxUpstream("http://admin:adminpass@publisher:9997/v3/config/global/get?token=secret"),
  "http://publisher:9997",
)
assert.equal(describeMediaMtxUpstream("/api/mediamtx"), "configured MediaMTX API upstream")

const timeoutPayload = mediaMtxProxyErrorPayload({
  error: new DOMException("timeout", "AbortError"),
  upstreamUrl: "http://admin:adminpass@publisher:9997/v3/config/global/get?token=secret",
})
assert.equal(timeoutPayload.error, "MediaMTX upstream timed out")
assert.equal(timeoutPayload.upstream, "http://publisher:9997")
assert.ok(!JSON.stringify(timeoutPayload).includes("adminpass"))

const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const proxyRoute = fs.readFileSync("app/api/mediamtx/[...path]/route.ts", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(proxyRoute.includes("parseMediaMtxProxyTimeoutMs"))
assert.ok(proxyRoute.includes("AbortController"))
