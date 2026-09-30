import type { SearchTurn } from '#shared/types/search'
import { analysePart } from '../../../../../../ai/partSearch'

/** Starts a new search for a part: the AI analyses the description, photos and details. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { project, part, partDoc, projectDoc, searches } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const input = await readValidatedBody(event, searchInputSchema.parse)

  const userText = [
    input.description && `Beschrijving: ${input.description}`,
    input.partNumber && `Onderdeelnummer: ${input.partNumber}`,
    input.info && `Extra informatie: ${input.info}`
  ].filter(Boolean).join('\n')

  const analysis = await analysePart({ project, part, history: [], userText, images: input.images, userUid: user.uid })

  const now = new Date().toISOString()
  const turn: SearchTurn = { at: now, userText, imageCount: input.images.length, analysis }
  const ref = await searches.add({ createdAt: now, createdBy: user.uid, createdByName: user.name ?? user.email ?? '', turns: [turn] })

  if (part.status === 'needed') await partDoc.ref.update({ status: 'searching', updatedAt: now })
  await projectDoc.ref.update({ updatedAt: now })
  return toSearch(await ref.get())
})
