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

assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "/api/mediamtx"),
  "/api/mediamtx/v3/config/global/get",
)
assert.equal(
  buildMediaMtxApiUrl("/v3/config/global/get", "http://localhost/v3/config"),
  "http://localhost/v3/config/global/get",
)
assert.equal(buildMediaMtxHlsUrl("mystream", "http://localhost/hls/"), "http://localhost/hls/mystream/index.m3u8")
assert.equal(
  normalizeMediaMtxUpstreamApiBaseUrl({ mediamtxApiUrl: "http://publisher:9997/v3/config" }),
  "http://publisher:9997",
)
assert.equal(
  normalizeMediaMtxUpstreamApiBaseUrl({
    mediamtxApiUrl: "",
    serverPublicApiUrl: "",
    publicApiUrl: "/api/mediamtx",
  }),
  "http://localhost:9997",
)
assert.equal(
  normalizeMediaMtxUpstreamApiBaseUrl({
    mediamtxApiUrl: "",
    serverPublicApiUrl: "",
    publicApiUrl: "http://localhost:9997/",
  }),
  "http://localhost:9997",
)

const localEnv = fs.readFileSync(".env.local", "utf8")
const dockerfile = fs.readFileSync("Dockerfile", "utf8")
const defaultCompose = fs.readFileSync("docker-compose.yml", "utf8")
const prodCompose = fs.readFileSync("docker-compose.prod.yml", "utf8")
const prometheusConfig = fs.readFileSync("prometheus.yml", "utf8")
const mediamtxProxyRoute = fs.readFileSync("app/api/mediamtx/[...path]/route.ts", "utf8")
const dockerDevScript = fs.readFileSync("scripts/docker-dev.sh", "utf8")
const pnpmDockerScript = fs.readFileSync("scripts/pnpm-docker.sh", "utf8")

assert.match(localEnv, /^NEXT_PUBLIC_MEDIAMTX_API_URL=\/api\/mediamtx$/m)
assert.match(localEnv, /^MEDIAMTX_API_URL=http:\/\/localhost:9997$/m)
assert.ok(!dockerfile.includes('NEXT_PUBLIC_MEDIAMTX_API_URL="http://localhost:80/v3/config"'))
assert.ok(!defaultCompose.includes("condition: service_healthy"))
assert.ok(!prodCompose.includes('wget", "--spider", "-q", "http://localhost:9997'))
assert.ok(!prodCompose.includes("condition: service_healthy"))
assert.ok(!prodCompose.includes("NEXT_PUBLIC_MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(prodCompose.includes("MEDIAMTX_API_URL=http://mediamtx:9997"))
assert.ok(mediamtxProxyRoute.includes("fetchWithStartupRetry"))

const mediamtxScrapeJob = prometheusConfig.match(/- job_name: mediamtx[\s\S]*?(?=\n\s*- job_name:|\s*$)/)?.[0] ?? ""
assert.match(mediamtxScrapeJob, /basic_auth:\s*\n\s*username: admin\s*\n\s*password: adminpass/)
assert.match(mediamtxScrapeJob, /targets:\s*\n\s*-\s*'publisher:9998'/)

const directDockerComposeCommand = /^\s*docker-compose(?:\s|$)/m
assert.match(dockerDevScript, /COMPOSE=\(docker compose\)/)
assert.match(pnpmDockerScript, /COMPOSE=\(docker compose\)/)
assert.ok(!directDockerComposeCommand.test(dockerDevScript))
assert.ok(!directDockerComposeCommand.test(pnpmDockerScript))
assert.ok(!pnpmDockerScript.includes("pnpm-lock.yaml"))
