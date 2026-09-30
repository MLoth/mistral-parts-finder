import type { SearchTurn } from '#shared/types/search'
import { analysePart } from '../../../../../../../ai/partSearch'

/** Adds an answer or extra information to a search and asks the AI to refine its analysis. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { project, part, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const ref = searches.doc(getRouterParam(event, 'searchId')!)
  const doc = await ref.get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Zoekopdracht niet gevonden' })

  const input = await readValidatedBody(event, refineInputSchema.parse)
  const search = toSearch(doc)

  const analysis = await analysePart({ project, part, history: search.turns, userText: input.answer, images: input.images, userUid: user.uid })

  const turn: SearchTurn = { at: new Date().toISOString(), userText: input.answer, imageCount: input.images.length, analysis }
  await ref.update({ turns: [...search.turns, turn] })
  return toSearch(await ref.get())
})
