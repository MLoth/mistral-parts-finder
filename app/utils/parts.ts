import type { PartStatus } from '#shared/types/project'

export const STATUS_LABELS: Record<PartStatus, string> = {
  needed: 'Needed',
  searching: 'Searching',
  sourced: 'Sourced',
  ordered: 'Ordered',
  received: 'Received'
}

export const STATUS_COLORS: Record<PartStatus, 'neutral' | 'warning' | 'info' | 'primary' | 'success'> = {
  needed: 'neutral',
  searching: 'warning',
  sourced: 'info',
  ordered: 'primary',
  received: 'success'
}

export const carLabel = (p: { make: string, model: string, year: number | null }) =>
  [p.year, p.make, p.model].filter(Boolean).join(' ')
