import type { SourceResult, SourceRun, SourceStatus } from '#shared/types/sourcing'
import type { SourceProvider, SourceQuery } from './types'
import { countryCodeFrom } from '#shared/utils/country'
import { dedupe, resultId } from './normalize'
import { enabledSources } from './settings'

const SOURCE_TIMEOUT_MS = 20_000
const RETRY_DELAY_MS = 1_500
const MAX_ATTEMPTS = 2
const MAX_RESULTS = 60

export type SearchHooks = {
  /** Called once, with the sources that are about to be searched */
  onPlan?: (sources: { id: string, name: string }[]) => void | Promise<void>
  /** Called as soon as each source has finished, successfully or not */
  onSource?: (status: SourceStatus & { attempts: number }, results: SourceResult[]) => void | Promise<void>
}

const withTimeout = <T>(promise: Promise<T>, ms: number) => Promise.race([
  promise,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Time-out: de bron reageerde niet op tijd')), ms))
])

/** A source that breaks its own rules is not worth retrying (for example robots.txt). */
const isRetryable = (error: unknown) => !(error instanceof Error && /robots\.txt/.test(error.message))

async function searchOne(source: SourceProvider, query: Omit<SourceQuery, 'limit'>) {
  let attempts = 0
  const maxAttempts = source.maxAttempts ?? MAX_ATTEMPTS
  for (;;) {
    attempts++
    try {
      return { raw: await withTimeout(source.search({ ...query, limit: MAX_RESULTS }), source.timeoutMs ?? SOURCE_TIMEOUT_MS), attempts }
    } catch (error) {
      if (attempts >= maxAttempts || !isRetryable(error)) throw Object.assign(error instanceof Error ? error : new Error('Fout'), { attempts })
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
}

/**
 * Searches every enabled source in parallel. A source that fails or is slow is retried once,
 * then reported in `statuses`, but never fails the whole run. Hooks report progress while it runs.
 */
export async function searchSources(query: Omit<SourceQuery, 'limit'>, hooks: SearchHooks = {}): Promise<SourceRun> {
  const sources = await enabledSources()
  if (!sources.length) throw createError({ statusCode: 503, statusMessage: 'Er is geen bron ingeschakeld. Een beheerder kan bronnen inschakelen onder Bronnen.' })
  await hooks.onPlan?.(sources.map(s => ({ id: s.id, name: s.name })))

  const statuses: SourceStatus[] = []
  const collected: SourceResult[] = []

  await Promise.all(sources.map(async (source) => {
    const started = Date.now()
    let status: SourceStatus & { attempts: number }
    let results: SourceResult[] = []
    try {
      const { raw, attempts } = await searchOne(source, query)
      results = raw.map(r => ({ ...r, countryCode: r.countryCode ?? countryCodeFrom(r.location), kind: r.kind ?? source.kind, id: resultId(r.url), sourceId: source.id, sourceName: source.name, alsoFoundOn: [] }))
      status = { sourceId: source.id, sourceName: source.name, ok: true, count: raw.length, ms: Date.now() - started, attempts }
    } catch (error) {
      status = { sourceId: source.id, sourceName: source.name, ok: false, count: 0, ms: Date.now() - started, attempts: (error as { attempts?: number }).attempts ?? 1, error: error instanceof Error ? error.message : 'Fout' }
    }
    collected.push(...results)
    statuses.push(status)
    await hooks.onSource?.(status, results)
  }))

  return {
    at: new Date().toISOString(),
    queries: query.queries,
    statuses,
    results: dedupe(collected).slice(0, MAX_RESULTS)
  }
}
