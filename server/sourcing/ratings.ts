import { createHash } from 'node:crypto'
import type { Rating, SourceRating, SourceRatingSummary } from '#shared/types/ratings'
import type { SourceResult, SourceRun } from '#shared/types/sourcing'
import { adjustScore, sourceScore } from '#shared/utils/scoring'
import { useFirestore } from '../utils/firebaseAdmin'

const col = () => useFirestore().collection('sourceRatings')

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url
  }
}

/** A person is rated separately from the marketplace they sell on. */
export function sourceIdentity(result: Pick<SourceResult, 'url' | 'seller' | 'kind'>) {
  const host = hostOf(result.url)
  const key = result.seller ? `seller:${host}:${result.seller.name.toLowerCase()}` : `site:${host}`
  const label = result.seller ? `${result.seller.name} (${host})` : host
  return { key, host, label, id: createHash('sha1').update(key).digest('hex').slice(0, 20), kind: result.kind }
}

const toRating = (id: string, data: FirebaseFirestore.DocumentData | undefined): SourceRating => {
  const ratings = (data?.ratings ?? []) as Rating[]
  const good = ratings.filter(r => r.verdict === 'good').length
  const bad = ratings.filter(r => r.verdict === 'bad').length
  return {
    id,
    key: data?.key ?? '',
    label: data?.label ?? '',
    host: data?.host ?? '',
    kind: data?.kind ?? '',
    ratings,
    good,
    bad,
    score: sourceScore(good, bad),
    blacklisted: !!data?.blacklisted
  }
}

const summary = (r: SourceRating): SourceRatingSummary => ({ score: r.score, good: r.good, bad: r.bad, blacklisted: r.blacklisted })

export async function ratingsFor(ids: string[]) {
  const unique = [...new Set(ids)]
  if (!unique.length) return new Map<string, SourceRating>()
  const docs = await useFirestore().getAll(...unique.map(id => col().doc(id)))
  return new Map(docs.filter(d => d.exists).map(d => [d.id, toRating(d.id, d.data())]))
}

export async function listRatings() {
  return (await col().get()).docs.map(d => toRating(d.id, d.data())).sort((a, b) => b.ratings.length - a.ratings.length || a.label.localeCompare(b.label))
}

export async function addRating(result: SourceResult, rating: Rating) {
  const identity = sourceIdentity(result)
  const ref = col().doc(identity.id)
  await useFirestore().runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    const ratings = [...((doc.data()?.ratings as Rating[] | undefined) ?? []), rating].slice(-200)
    tx.set(ref, { key: identity.key, label: doc.data()?.label ?? identity.label, host: identity.host, kind: identity.kind, ratings, blacklisted: !!doc.data()?.blacklisted }, { merge: true })
  })
}

export const patchRating = (id: string, patch: { blacklisted?: boolean, label?: string }) => col().doc(id).update(patch)

export async function deleteRating(id: string, ratingId: string) {
  const ref = col().doc(id)
  const doc = await ref.get()
  if (!doc.exists) return
  await ref.update({ ratings: ((doc.data()!.ratings ?? []) as Rating[]).filter(r => r.id !== ratingId) })
}

export const summaryFor = (map: Map<string, SourceRating>, result: SourceResult) => {
  const found = map.get(sourceIdentity(result).id)
  return found ? summary(found) : null
}

/** Removes results from blacklisted sources, before spending AI tokens on them. */
export async function hideBlacklisted(run: SourceRun): Promise<SourceRun> {
  const map = await ratingsFor(run.results.map(r => sourceIdentity(r).id))
  const results = run.results.filter(r => !summaryFor(map, r)?.blacklisted)
  return { ...run, results, hiddenBlacklisted: run.results.length - results.length }
}

/** Adds each source's history to its results and combines it with the AI score. Sorts best first. */
export async function applySourceScores(run: SourceRun): Promise<SourceRun> {
  const map = await ratingsFor(run.results.map(r => sourceIdentity(r).id))
  const results = run.results.map((r) => {
    const rating = summaryFor(map, r)
    const base = { ...r, sourceKey: sourceIdentity(r).key, sourceRating: rating }
    if (!rating || rating.good + rating.bad === 0) return base
    const ai = r.score ?? 0
    return {
      ...base,
      aiScore: ai,
      score: adjustScore(ai, rating.score),
      reason: `${r.reason ?? ''} Bron: ${rating.good}× goed en ${rating.bad}× slecht beoordeeld door collega's.`.trim()
    }
  })
  return { ...run, results: results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) }
}
