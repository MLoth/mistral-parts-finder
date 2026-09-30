import { z } from 'zod'
import { PART_STATUSES } from '../types/project'

export const displayNameSchema = z.string().trim().min(2, 'Minstens 2 tekens').max(40, 'Maximaal 40 tekens')

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  make: z.string().trim().max(60).default(''),
  model: z.string().trim().max(60).default(''),
  year: z.number().int().min(1885).max(new Date().getFullYear() + 1).nullable().default(null),
  notes: z.string().trim().max(2000).default('')
})
export type ProjectInput = z.infer<typeof projectSchema>

export const partSchema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  quantity: z.number().int().min(1).max(999).default(1),
  partNumber: z.string().trim().max(60).default(''),
  notes: z.string().trim().max(2000).default(''),
  status: z.enum(PART_STATUSES).default('needed')
})
export type PartInput = z.infer<typeof partSchema>

const imageSchema = z.object({
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  base64: z.string().min(1).max(3_000_000)
})

export const searchInputSchema = z.object({
  description: z.string().trim().max(2000).default(''),
  partNumber: z.string().trim().max(80).default(''),
  info: z.string().trim().max(2000).default(''),
  images: z.array(imageSchema).max(4).default([])
}).refine(v => v.description || v.partNumber || v.info || v.images.length, {
  message: 'Vul minstens een beschrijving, onderdeelnummer, extra informatie of foto in'
})
export type SearchInput = z.infer<typeof searchInputSchema>

export const refineInputSchema = z.object({
  answer: z.string().trim().max(2000).default(''),
  images: z.array(imageSchema).max(4).default([])
}).refine(v => v.answer || v.images.length, { message: 'Geef een antwoord of voeg een foto toe' })
export type RefineInput = z.infer<typeof refineInputSchema>

export const partAnalysisSchema = z.object({
  partName: z.string(),
  category: z.string(),
  alternativeNames: z.array(z.string()),
  possiblePartNumbers: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string(),
  questions: z.array(z.string()),
  searchQueries: z.array(z.string())
})

export const saveResultSchema = z.object({ searchId: z.string().min(1), resultId: z.string().min(1) })

export const contactSchema = z.object({
  note: z.string().trim().max(1000).default(''),
  outcome: z.enum(['contacted', 'no-reply', 'interested', 'not-available', 'declined', 'bought'])
})

export const rankingSchema = z.object({
  rankings: z.array(z.object({ index: z.number().int(), score: z.number(), reason: z.string() }))
})
