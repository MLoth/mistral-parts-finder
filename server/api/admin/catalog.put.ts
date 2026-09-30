import { z } from 'zod'

const schema = z.object({
  brands: z.array(z.object({
    name: z.string().trim().min(1, 'Een merk heeft een naam nodig').max(60),
    models: z.array(z.string().trim().min(1).max(60)).max(500)
  })).max(300)
}).superRefine((value, ctx) => {
  const seen = new Set<string>()
  for (const b of value.brands) {
    const key = b.name.toLowerCase()
    if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `Het merk "${b.name}" staat er dubbel in` })
    seen.add(key)
  }
})

/** Replaces the whole catalogue. Existing projects keep the brand and type text they were saved with. */
export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const { brands } = await readValidatedBody(event, schema.parse)
  await saveCatalog(brands)
  return loadCatalog()
})
