import { rankResults } from '../../../../../../../ai/rankResults'
import { applySourceScores, hideBlacklisted } from '../../../../../../../sourcing/ratings'
import { searchSources } from '../../../../../../../sourcing/run'

/** Looks up the latest analysis in all enabled sources, ranks the results and stores them on the search. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { project, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const ref = searches.doc(getRouterParam(event, 'searchId')!)
  const doc = await ref.get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Zoekopdracht niet gevonden' })

  const analysis = toSearch(doc).turns.at(-1)!.analysis
  const found = await searchSources({
    queries: analysis.searchQueries,
    partNumbers: analysis.possiblePartNumbers,
    car: { make: project.make, model: project.model, year: project.year }
  })

  const ranked = await rankResults(await hideBlacklisted(found), analysis, project, user.uid)
  const run = await applySourceScores(ranked)
  await ref.update({ sources: run })
  return toSearch(await ref.get())
})
