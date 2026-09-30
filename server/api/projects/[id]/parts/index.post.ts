import { z } from 'zod'

/** Adds one or more parts in one request. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const doc = await getProjectOr404(getRouterParam(event, 'id')!)
  const parts = await readValidatedBody(event, z.array(partSchema).min(1).max(50).parse)

  const db = useFirestore()
  const batch = db.batch()
  const now = new Date().toISOString()
  parts.forEach((part, i) => {
    // Distinct createdAt keeps the order the parts were entered in
    const at = new Date(Date.parse(now) + i).toISOString()
    batch.set(doc.ref.collection('parts').doc(), { ...part, createdAt: at, updatedAt: at })
  })
  batch.update(doc.ref, { updatedAt: now })
  await batch.commit()

  return loadParts(doc.id)
})
