import assert from "node:assert/strict"
import fs from "node:fs"

import {
  buildMediaMtxApiUrl,
  buildMediaMtxHlsUrl,
  normalizeMediaMtxApiBaseUrl,
} from "../lib/mediamtx-url.mjs"
import { buildDashboardPathRows, summarizeDashboardPaths } from "../lib/path-display.mjs"

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

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))

const defaultOnlyRows = buildDashboardPathRows(
  [{ name: "all_others", source: "publisher" }],
  [{ name: "camera/front", ready: true, source: { type: "rtsp" }, readers: [] }],
)
assert.deepEqual(defaultOnlyRows, [
  {
    name: "camera/front",
    source: "Live rtsp source",
    runtimeOnly: true,
  },
])

assert.deepEqual(
  summarizeDashboardPaths([{ name: "all_others", source: "publisher" }], [
    { name: "camera/front", ready: true, readers: [] },
  ]),
  {
    activeStreamsCount: 1,
    idleConfiguredCount: 0,
    totalDashboardPathCount: 1,
  },
)

assert.deepEqual(
  buildDashboardPathRows(
    [
      { name: "all_others", source: "publisher" },
      { name: "camera/front", source: "publisher" },
    ],
    [{ name: "camera/front", ready: true, source: { type: "rtsp" }, readers: [] }],
  ),
  [
    {
      name: "camera/front",
      source: "publisher",
      runtimeOnly: false,
    },
  ],
)
