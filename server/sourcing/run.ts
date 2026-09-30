import type { SourceResult, SourceRun, SourceStatus } from '#shared/types/sourcing'
import type { SourceQuery } from './types'
import { dedupe, resultId } from './normalize'
import { enabledSources } from './settings'

const SOURCE_TIMEOUT_MS = 20_000
const MAX_RESULTS = 60

/**
 * Searches every enabled source in parallel. A source that fails or is slow
 * is reported in `statuses` but never fails the whole run.
 */
export async function searchSources(query: Omit<SourceQuery, 'limit'>): Promise<SourceRun> {
  const sources = await enabledSources()
  if (!sources.length) throw createError({ statusCode: 503, statusMessage: 'Er is geen bron ingeschakeld. Een beheerder kan bronnen inschakelen onder Bronnen.' })

  const statuses: SourceStatus[] = []
  const collected: SourceResult[] = []

  await Promise.all(sources.map(async (source) => {
    const started = Date.now()
    try {
      const raw = await Promise.race([
        source.search({ ...query, limit: MAX_RESULTS }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Time-out')), SOURCE_TIMEOUT_MS))
      ])
      for (const r of raw) {
        collected.push({ ...r, kind: r.kind ?? source.kind, id: resultId(r.url), sourceId: source.id, sourceName: source.name, alsoFoundOn: [] })
      }
      statuses.push({ sourceId: source.id, sourceName: source.name, ok: true, count: raw.length, ms: Date.now() - started })
    } catch (error) {
      statuses.push({ sourceId: source.id, sourceName: source.name, ok: false, count: 0, ms: Date.now() - started, error: error instanceof Error ? error.message : 'Fout' })
    }
  }))

  return {
    at: new Date().toISOString(),
    queries: query.queries,
    statuses,
    results: dedupe(collected).slice(0, MAX_RESULTS)
  }
}
