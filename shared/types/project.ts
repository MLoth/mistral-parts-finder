export const PART_STATUSES = ['needed', 'searching', 'sourced', 'ordered', 'received'] as const
export type PartStatus = typeof PART_STATUSES[number]

/** Statuses that count towards project progress ("sourced" or further along) */
export const SOURCED_STATUSES: readonly PartStatus[] = ['sourced', 'ordered', 'received']

export type Project = {
  id: string
  name: string
  make: string
  model: string
  year: number | null
  notes: string
  createdBy: string
  createdByEmail: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  partsTotal: number
  partsSourced: number
}

export type Part = {
  id: string
  name: string
  quantity: number
  partNumber: string
  notes: string
  status: PartStatus
  createdAt: string
  updatedAt: string
}
