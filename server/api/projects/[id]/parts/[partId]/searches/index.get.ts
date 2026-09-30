import { isStale, staleJob } from '../../../../../../sourcing/job'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const snap = await searches.orderBy('createdAt', 'desc').get()

  return Promise.all(snap.docs.map(async (doc) => {
    const search = toSearch(doc)
    if (search.job && isStale(search.job)) {
      search.job = staleJob(search.job)
      await doc.ref.update({ job: search.job })
    }
    return search
  }))
})
