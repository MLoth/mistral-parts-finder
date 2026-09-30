export const RATING_REASONS = ['price', 'speed', 'reliability', 'quality', 'matched'] as const
export type RatingReason = typeof RATING_REASONS[number]
export type Verdict = 'good' | 'bad'

export type Rating = {
  id: string
  at: string
  by: string
  verdict: Verdict
  reasons: RatingReason[]
  note: string
  /** Where it was used, e.g. "E-Type restauratie / Koplampring" */
  context: string
}

/** A shop, marketplace, forum or individual seller that colleagues have rated. Shared company-wide. */
export type SourceRating = {
  id: string
  key: string
  label: string
  host: string
  kind: string
  ratings: Rating[]
  good: number
  bad: number
  /** 0-100, 50 when unrated */
  score: number
  blacklisted: boolean
}

/** What results and saved results carry about a source's history. */
export type SourceRatingSummary = { score: number, good: number, bad: number, blacklisted: boolean }
