import type { PartStatus } from '#shared/types/project'

export const STATUS_LABELS: Record<PartStatus, string> = {
  needed: 'Nodig',
  searching: 'Zoeken',
  sourced: 'Gevonden',
  ordered: 'Besteld',
  received: 'Ontvangen'
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

export const ROLE_LABELS = { admin: 'Beheerder', staff: 'Medewerker' } as const
export const ROLE_ITEMS = [
  { label: ROLE_LABELS.staff, value: 'staff' },
  { label: ROLE_LABELS.admin, value: 'admin' }
]

export const OUTCOME_LABELS = {
  'contacted': 'Contact opgenomen',
  'no-reply': 'Geen reactie',
  'interested': 'Interesse',
  'not-available': 'Niet beschikbaar',
  'declined': 'Afgewezen',
  'bought': 'Gekocht'
} as const

export const REASON_LABELS = {
  price: 'Prijs',
  speed: 'Snelheid',
  reliability: 'Betrouwbaarheid',
  quality: 'Kwaliteit',
  matched: 'Onderdeel klopte'
} as const
