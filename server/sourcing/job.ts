import { randomUUID } from 'node:crypto'
import type { DocumentReference } from 'firebase-admin/firestore'
import type { Project } from '#shared/types/project'
import type { PartAnalysis, SearchJob } from '#shared/types/search'
import { rankResults } from '../ai/rankResults'
import { dedupe } from './normalize'
import { applySourceScores, hideBlacklisted } from './ratings'
import { searchSources } from './run'

/** The whole job (sources, filtering and AI ranking) must finish within this. */
const JOB_DEADLINE_MS = 120_000
/** A job that has not reported for this long is assumed dead (for example the server restarted). */
const STALE_MS = 180_000
const MAX_PARTIAL = 60

export const isRunning = (job: SearchJob | undefined) => job?.status === 'running'
export const isStale = (job: SearchJob) => job.status === 'running' && Date.now() - Date.parse(job.updatedAt) > STALE_MS

export const staleJob = (job: SearchJob): SearchJob => ({
  ...job,
  status: 'failed',
  finishedAt: new Date().toISOString(),
  error: 'De zoekopdracht is onderbroken (de server was tussentijds niet bereikbaar). Probeer het opnieuw.'
})

/**
 * Starts a lookup of a search's latest analysis in the sources, then ranks the results.
 * Returns straight away with the new job; `done` settles when the job has finished (it never rejects).
 * Progress and partial results are written to the search document as the job goes.
 */
export async function startSourcesJob(opts: { searchRef: DocumentReference, project: Project, analysis: PartAnalysis, userUid: string }) {
  const now = () => new Date().toISOString()
  const job: SearchJob = { id: randomUUID(), status: 'running', stage: 'sources', startedAt: now(), updatedAt: now(), sources: [], partial: [] }
  let cancelled = false

  // Writes are queued so progress updates from parallel sources never overwrite each other
  let queue: Promise<unknown> = opts.searchRef.update({ job })
  const flush = () => {
    job.updatedAt = now()
    const snapshot = JSON.parse(JSON.stringify(job)) as SearchJob
    queue = queue.then(() => (cancelled ? undefined : opts.searchRef.update({ job: snapshot }))).catch(() => undefined)
    return queue
  }

  async function run() {
    const found = await searchSources({
      queries: opts.analysis.searchQueries,
      partNumbers: opts.analysis.possiblePartNumbers,
      car: { make: opts.project.make, model: opts.project.model, year: opts.project.year }
    }, {
      onPlan: async (sources) => {
        job.sources = sources.map(s => ({ ...s, state: 'pending' }))
        await flush()
      },
      onSource: async (status, results) => {
        job.sources = job.sources.map(s => s.id === status.sourceId
          ? { ...s, state: status.ok ? 'done' : 'failed', count: status.count, ms: status.ms, attempts: status.attempts, ...(status.error && { error: status.error }) }
          : s)
        job.partial = dedupe([...job.partial, ...results]).slice(0, MAX_PARTIAL)
        await flush()
      }
    })

    if (found.statuses.length && found.statuses.every(s => !s.ok)) {
      throw new Error(`Alle bronnen zijn mislukt: ${found.statuses.map(s => `${s.sourceName} (${s.error})`).join('; ')}`)
    }

    job.stage = 'ranking'
    await flush()
    const visible = await hideBlacklisted(found)
    const ranked = await rankResults(visible, opts.analysis, opts.project, opts.userUid)
    return applySourceScores(ranked)
  }

  const done = (async () => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('De zoekopdracht duurde te lang en is gestopt.')), JOB_DEADLINE_MS)
      })
      const results = await Promise.race([run(), deadline])
      await queue
      job.status = 'done'
      job.finishedAt = now()
      job.partial = []
      job.updatedAt = job.finishedAt
      await opts.searchRef.update({ sources: results, job })
    } catch (error) {
      cancelled = true
      await queue
      job.status = 'failed'
      job.finishedAt = now()
      job.updatedAt = job.finishedAt
      job.error = error instanceof Error ? error.message : 'De zoekopdracht is mislukt.'
      await opts.searchRef.update({ job }).catch(() => undefined)
    } finally {
      clearTimeout(timer)
    }
  })()

  await queue
  return { job, done }
}
