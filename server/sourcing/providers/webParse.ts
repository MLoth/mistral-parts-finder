import { z } from 'zod'
import { normalizeUrl } from '../normalize'
import type { RawResult } from '../types'

const resultSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim(),
  kind: z.enum(['webshop', 'marketplace', 'seller', 'forum']).catch('webshop'),
  price: z.object({ amount: z.number().positive(), currency: z.string().trim().length(3).transform(c => c.toUpperCase()) }).nullable().catch(null),
  condition: z.enum(['new', 'used', 'refurbished']).nullable().catch(null),
  location: z.string().trim().max(120).catch(''),
  countryCode: z.string().trim().length(2).transform(c => c.toLowerCase()).nullable().catch(null),
  snippet: z.string().trim().max(400).catch('')
})

/** Takes the JSON object out of a reply that may have text or a code fence around it. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Het antwoord van de webzoekactie bevatte geen resultaten in het verwachte formaat')
  return JSON.parse(text.slice(start, end + 1))
}

/**
 * Turns the model's reply into results. A result is only kept when its link is one that the
 * web search really returned, so invented links never reach the results list.
 */
export function parseWebResults(text: string, foundUrls: string[], limit: number): RawResult[] {
  const known = new Set(foundUrls.map(normalizeUrl))
  const raw = extractJson(text) as { results?: unknown[] }
  const results: RawResult[] = []

  for (const item of Array.isArray(raw.results) ? raw.results : []) {
    const parsed = resultSchema.safeParse(item)
    if (!parsed.success) continue
    const r = parsed.data
    if (!/^https?:\/\//i.test(r.url) || !known.has(normalizeUrl(r.url))) continue
    results.push({ title: r.title, url: r.url, kind: r.kind, price: r.price, condition: r.condition, location: r.location, countryCode: r.countryCode, seller: null, snippet: r.snippet, imageUrl: null })
    if (results.length >= limit) break
  }
  return results
}
