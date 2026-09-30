import { createHash } from 'node:crypto'
import type { RawResult, SourceProvider, SourceQuery } from '../types'

const SHOPS = [
  { name: 'Demo Onderdelenshop', kind: 'webshop' as const, location: 'Nederland' },
  { name: 'Demo Marktplaats', kind: 'marketplace' as const, location: 'België' },
  { name: 'Demo Klassiekerforum', kind: 'forum' as const, location: 'Duitsland' },
  { name: 'Demo Verkoper', kind: 'seller' as const, location: 'Verenigd Koninkrijk' }
]

const seed = (text: string, salt: string) => parseInt(createHash('sha1').update(text + salt).digest('hex').slice(0, 8), 16)

/** Returns believable but made-up results, so the whole flow can be built and demoed without real searching. */
export const demoSource: SourceProvider = {
  id: 'demo',
  name: 'Demo',
  kind: 'webshop',
  description: 'Verzonnen resultaten om de app te testen. Geen echte zoekopdrachten.',
  demo: true,
  async search(query: SourceQuery): Promise<RawResult[]> {
    const terms = query.queries.length ? query.queries : query.partNumbers
    const car = [query.car.year, query.car.make, query.car.model].filter(Boolean).join(' ')
    const results: RawResult[] = []

    for (const term of terms.slice(0, 3)) {
      SHOPS.forEach((shop, i) => {
        const n = seed(term, shop.name)
        const slug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
        results.push({
          kind: shop.kind,
          title: `${term}${car ? ` voor ${car}` : ''}`,
          // .invalid is reserved and never resolves, so demo links can't point at a real site
          url: `https://${shop.name.toLowerCase().replace(/\W+/g, '-')}.invalid/item/${slug}?utm_source=demo&id=${n % 1000}`,
          price: shop.kind === 'forum' ? null : { amount: 15 + (n % 435), currency: shop.kind === 'seller' ? 'GBP' : 'EUR' },
          condition: (['new', 'used', 'refurbished'] as const)[(n + i) % 3]!,
          location: shop.location,
          seller: shop.kind === 'seller' || shop.kind === 'marketplace' ? { name: `Demo verkoper ${n % 90}`, contact: `verkoper${n % 90}@demo.invalid` } : null,
          snippet: `Demo-resultaat voor "${term}". Niet echt.`,
          imageUrl: null
        })
      })
    }
    // A repeated listing (same URL, different tracking parameter) to exercise de-duplication
    if (results[0]) results.push({ ...results[0], url: results[0].url.replace('utm_source=demo', 'utm_source=mail'), price: null, snippet: '' })
    return results.slice(0, query.limit)
  }
}
