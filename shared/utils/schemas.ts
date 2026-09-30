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
