import { searchSources } from '../../../../../../../sourcing/run'

/** Looks up the latest analysis of a search in all enabled sources and stores the results on the search. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { project, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const ref = searches.doc(getRouterParam(event, 'searchId')!)
  const doc = await ref.get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Zoekopdracht niet gevonden' })

  const analysis = toSearch(doc).turns.at(-1)!.analysis
  const run = await searchSources({
    queries: analysis.searchQueries,
    partNumbers: analysis.possiblePartNumbers,
    car: { make: project.make, model: project.model, year: project.year }
  })

  await ref.update({ sources: run })
  return toSearch(await ref.get())
})
