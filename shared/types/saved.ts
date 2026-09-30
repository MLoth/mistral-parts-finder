import type { SourceResult } from './sourcing'

export const CONTACT_OUTCOMES = ['contacted', 'no-reply', 'interested', 'not-available', 'declined', 'bought'] as const
export type ContactOutcome = typeof CONTACT_OUTCOMES[number]

export type ContactEntry = {
  id: string
  at: string
  by: string
  note: string
  outcome: ContactOutcome
}

/** A result a colleague saved to a part, with what happened when contacting the seller. */
export type SavedResult = {
  id: string
  savedAt: string
  savedBy: string
  result: SourceResult
  contacts: ContactEntry[]
  sourceKey?: string
  sourceRating?: import('./ratings').SourceRatingSummary | null
}
