/**
 * Tests for the paginated MediaMTX list fetching.
 *
 * Validates that all pages are collected when pageCount > 1, that a single-page
 * response is handled without extra requests, and that sparse/null items arrays
 * never cause a crash.
 */

import assert from "node:assert/strict"

// ---------------------------------------------------------------------------
// Pure re-implementation of fetchAllPages — same logic, accepts a fetcher so
// we can drive it from Node without a browser or a live MediaMTX instance.
// ---------------------------------------------------------------------------

async function fetchAllPages(endpoint, fetcher) {
  const first = await fetcher(`${endpoint}?page=0`)
  const all = Array.isArray(first?.items) ? [...first.items] : []
  const pageCount = first?.pageCount ?? 1

  if (pageCount <= 1) return all

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) =>
      fetcher(`${endpoint}?page=${i + 1}`),
    ),
  )

  for (const page of rest) {
    if (Array.isArray(page?.items)) all.push(...page.items)
  }

  return all
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetcher(pages) {
  const calls = []
  const fetcher = async (url) => {
    calls.push(url)
    const match = url.match(/[?&]page=(\d+)/)
    const pageIndex = match ? parseInt(match[1], 10) : 0
    return pages[pageIndex]
  }
  fetcher.calls = calls
  return fetcher
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

console.log("pagination tests")

await test("single page — returns items without extra fetches", async () => {
  const pages = [{ pageCount: 1, itemCount: 2, items: [{ name: "a" }, { name: "b" }] }]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 2)
  assert.equal(result[0].name, "a")
  assert.equal(fetcher.calls.length, 1)
  assert.ok(fetcher.calls[0].includes("page=0"))
})

await test("two pages — all items returned in order", async () => {
  const pages = [
    { pageCount: 2, itemCount: 3, items: [{ name: "a" }, { name: "b" }] },
    { pageCount: 2, itemCount: 3, items: [{ name: "c" }] },
  ]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 3)
  assert.deepEqual(
    result.map((r) => r.name),
    ["a", "b", "c"],
  )
  assert.equal(fetcher.calls.length, 2)
})

await test("three pages — all items from all pages", async () => {
  const pages = [
    { pageCount: 3, itemCount: 7, items: Array.from({ length: 3 }, (_, i) => ({ name: `s${i}` })) },
    { pageCount: 3, itemCount: 7, items: Array.from({ length: 3 }, (_, i) => ({ name: `s${i + 3}` })) },
    { pageCount: 3, itemCount: 7, items: [{ name: "s6" }] },
  ]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 7)
  assert.equal(fetcher.calls.length, 3)
  assert.ok(fetcher.calls.some((c) => c.includes("page=2")))
})

await test("missing pageCount — treated as single page, no extra requests", async () => {
  const pages = [{ items: [{ name: "x" }] }] // pageCount absent
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 1)
  assert.equal(fetcher.calls.length, 1)
})

await test("null items array — returns empty list without crashing", async () => {
  const pages = [{ pageCount: 1, itemCount: 0, items: null }]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 0)
})

await test("second page has null items — skipped gracefully", async () => {
  const pages = [
    { pageCount: 2, itemCount: 1, items: [{ name: "a" }] },
    { pageCount: 2, itemCount: 1, items: null },
  ]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/paths/list", fetcher)

  assert.equal(result.length, 1)
  assert.equal(result[0].name, "a")
})

await test("config/paths/list endpoint uses correct page param", async () => {
  const pages = [
    { pageCount: 2, itemCount: 2, items: [{ name: "cam1", source: "rtsp://x" }] },
    { pageCount: 2, itemCount: 2, items: [{ name: "cam2", source: "rtsp://y" }] },
  ]
  const fetcher = makeFetcher(pages)

  const result = await fetchAllPages("/v3/config/paths/list", fetcher)

  assert.equal(result.length, 2)
  assert.ok(fetcher.calls[0].includes("/v3/config/paths/list?page=0"))
  assert.ok(fetcher.calls[1].includes("/v3/config/paths/list?page=1"))
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("")
console.log(`${passed} passed, ${failed} failed`)

if (failed > 0) process.exit(1)
