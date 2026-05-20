import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
} from "../lib/mediamtx-url.mjs"
import { corsHeaders } from "../lib/mediamtx-proxy-cors.mjs"

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
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const mediaMtxProxyRoute = fs.readFileSync("app/api/mediamtx/[...path]/route.ts", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(mediaMtxProxyRoute.includes("export const HEAD = proxyMediaMtxRequest"))
assert.ok(mediaMtxProxyRoute.includes("export function OPTIONS"))

const sameOriginPreflightHeaders = corsHeaders(
  new Request("http://localhost:3000/api/mediamtx/v3/config/global/get", {
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-headers": "authorization, x-not-allowed, content-type",
    },
  }),
)

assert.equal(sameOriginPreflightHeaders.get("access-control-allow-origin"), "http://localhost:3000")
assert.equal(sameOriginPreflightHeaders.get("access-control-allow-headers"), "authorization, content-type")
assert.ok(sameOriginPreflightHeaders.get("access-control-allow-methods").includes("HEAD"))
assert.ok(sameOriginPreflightHeaders.get("vary").includes("Origin"))

const configuredOriginHeaders = corsHeaders(
  new Request("http://localhost:3000/api/mediamtx/v3/config/global/get", {
    headers: { origin: "https://dashboard.example.test" },
  }),
  "https://dashboard.example.test",
)

assert.equal(configuredOriginHeaders.get("access-control-allow-origin"), "https://dashboard.example.test")

const rejectedOriginHeaders = corsHeaders(
  new Request("http://localhost:3000/api/mediamtx/v3/config/global/get", {
    headers: { origin: "https://evil.example.test" },
  }),
  "https://dashboard.example.test",
)

assert.equal(rejectedOriginHeaders.get("access-control-allow-origin"), null)
assert.ok(rejectedOriginHeaders.get("vary").includes("Access-Control-Request-Headers"))
