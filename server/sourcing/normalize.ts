import { createHash } from 'node:crypto'
import type { SourceResult } from '#shared/types/sourcing'

const TRACKING = /^(utm_|fbclid|gclid|mc_|ref$|ref_$|source$)/i

/** Lowercase host, no fragment, no tracking parameters, sorted query, no trailing slash. */
export function normalizeUrl(input: string) {
  try {
    const url = new URL(input)
    url.hash = ''
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING.test(key)) url.searchParams.delete(key)
    }
    url.searchParams.sort()
    return url.toString().replace(/\/$/, '')
  } catch {
    return input.trim()
  }
}

export const resultId = (url: string) => createHash('sha1').update(normalizeUrl(url)).digest('hex').slice(0, 20)

const richness = (r: SourceResult) => (r.price ? 2 : 0) + (r.imageUrl ? 1 : 0) + (r.seller ? 1 : 0) + (r.snippet ? 1 : 0)

/** Merges results that point at the same listing, keeping the most complete one. */
export function dedupe(results: SourceResult[]): SourceResult[] {
  const byId = new Map<string, SourceResult>()
  for (const result of results) {
    const existing = byId.get(result.id)
    if (!existing) {
      byId.set(result.id, result)
      continue
    }
    const [keep, other] = richness(result) > richness(existing) ? [result, existing] : [existing, result]
    byId.set(result.id, { ...keep, alsoFoundOn: [...new Set([...keep.alsoFoundOn, ...other.alsoFoundOn, other.sourceName])].filter(n => n !== keep.sourceName) })
  }
  return [...byId.values()]
}
