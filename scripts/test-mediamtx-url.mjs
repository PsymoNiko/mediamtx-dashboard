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
const dockerDevScript = fs.readFileSync("scripts/docker-dev.sh", "utf8")
const pnpmDockerScript = fs.readFileSync("scripts/pnpm-docker.sh", "utf8")

assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))

for (const [scriptName, script] of [
  ["scripts/docker-dev.sh", dockerDevScript],
  ["scripts/pnpm-docker.sh", pnpmDockerScript],
]) {
  assert.ok(script.includes("docker compose version"), `${scriptName} should probe Docker Compose v2`)
  assert.ok(script.includes("compose_cmd=(docker compose)"), `${scriptName} should prefer Docker Compose v2`)
  assert.ok(!/^\s*docker-compose\s+(up|down|restart|logs|build|ps|exec|-f)\b/m.test(script))
}
