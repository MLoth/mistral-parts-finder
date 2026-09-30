import { isRunning, isStale, startSourcesJob } from '../../../../../../../sourcing/job'

/**
 * Starts the lookup in the sources as a background job and returns at once.
 * The page polls the search to follow the progress.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { project, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const ref = searches.doc(getRouterParam(event, 'searchId')!)
  const doc = await ref.get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Zoekopdracht niet gevonden' })

  const search = toSearch(doc)
  if (isRunning(search.job) && !isStale(search.job!)) {
    throw createError({ statusCode: 409, statusMessage: 'Er loopt al een zoekopdracht in de bronnen voor deze zoekactie.' })
  }

  const { job, done } = await startSourcesJob({ searchRef: ref, project, analysis: search.turns.at(-1)!.analysis, userUid: user.uid })
  // Keeps the job alive on hosts that stop work once the response has been sent
  event.waitUntil(done)
  setResponseStatus(event, 202)
  return { job }
})
