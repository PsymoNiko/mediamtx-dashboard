import { NextResponse } from "next/server"

function normalizeUpstreamApiUrl() {
  const configuredUrl =
    process.env.MEDIAMTX_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_SERVER_API_URL ||
    process.env.NEXT_PUBLIC_MEDIAMTX_API_URL ||
    "http://localhost:9997"

  return configuredUrl.trim().replace(/\/+$/, "").replace(/\/v3\/config$/i, "").replace(/\/v3$/i, "")
}

export async function GET() {
  const upstreamUrl = normalizeUpstreamApiUrl()
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    upstream_url: upstreamUrl,
    checks: {
      upstream_reachable: false,
      api_v3_responding: false,
      auth_required: null,
    }
  }

  try {
    // 1. Basic reachability test (timeout 2s)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    const response = await fetch(`${upstreamUrl}/v3/config/global/get`, {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    diagnostics.checks.upstream_reachable = true
    diagnostics.checks.api_v3_responding = true
    diagnostics.checks.auth_status = response.status
    
    if (response.status === 401) {
      diagnostics.checks.auth_required = true
    } else if (response.ok) {
      diagnostics.checks.auth_required = false
    }

  } catch (error: any) {
    diagnostics.error = error.message
    if (error.name === 'AbortError') {
      diagnostics.error = "Connection timed out"
    }
  }

  return NextResponse.json(diagnostics)
}
