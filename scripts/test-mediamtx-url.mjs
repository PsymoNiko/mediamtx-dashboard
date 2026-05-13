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
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const defaultCompose = fs.readFileSync("docker-compose.yml", "utf8")
const makefile = fs.readFileSync("Makefile", "utf8")
const dockerDevScript = fs.readFileSync("scripts/docker-dev.sh", "utf8")
const pnpmDockerScript = fs.readFileSync("scripts/pnpm-docker.sh", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))

assert.ok(defaultCompose.includes("  publisher:"))
assert.ok(makefile.includes("docker-compose logs -f publisher"))
assert.ok(makefile.includes("docker-compose exec publisher sh"))
assert.ok(!makefile.includes("docker-compose logs -f mediamtx"))
assert.ok(!makefile.includes("docker-compose exec mediamtx sh"))
assert.ok(dockerDevScript.includes("docker-compose exec publisher sh"))
assert.ok(!dockerDevScript.includes("docker-compose exec mediamtx sh"))
assert.ok(pnpmDockerScript.includes('if [ "$service" = "mediamtx" ]; then'))
assert.ok(pnpmDockerScript.includes('if [ -n "$service" ]; then'))
assert.ok(pnpmDockerScript.includes("docker-compose exec publisher sh"))
assert.ok(!pnpmDockerScript.includes("docker-compose exec mediamtx sh"))
