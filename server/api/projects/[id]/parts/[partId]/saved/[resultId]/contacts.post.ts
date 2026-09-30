import { randomUUID } from 'node:crypto'
import type { ContactEntry, SavedResult } from '#shared/types/saved'

/** Adds an entry to the contact log of a saved result. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { partDoc } = await loadPartContext(getRouterParam(event, 'id')!, getRouterParam(event, 'partId')!)
  const ref = partDoc.ref.collection('saved').doc(getRouterParam(event, 'resultId')!)
  const doc = await ref.get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Opgeslagen resultaat niet gevonden' })

  const body = await readValidatedBody(event, contactSchema.parse)
  const entry: ContactEntry = { id: randomUUID(), at: new Date().toISOString(), by: user.name ?? user.email ?? '', ...body }
  const contacts = [...((doc.data() as SavedResult).contacts ?? []), entry]
  await ref.update({ contacts })
  return { id: doc.id, ...doc.data(), contacts } as SavedResult
})
