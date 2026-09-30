export type SourceKind = 'webshop' | 'marketplace' | 'seller' | 'forum'
export type Condition = 'new' | 'used' | 'refurbished'

/** One potential place to get a part, in the same shape whichever source found it. */
export type SourceResult = {
  /** Stable id derived from the normalized URL, also the de-duplication key */
  id: string
  sourceId: string
  sourceName: string
  kind: SourceKind
  title: string
  url: string
  price: { amount: number, currency: string } | null
  condition: Condition | null
  location: string
  /** ISO 3166-1 alpha-2, lowercase ("nl"). Given by the source or guessed from `location`. */
  countryCode?: string | null
  seller: { name: string, contact: string } | null
  snippet: string
  imageUrl: string | null
  /** Other sources that returned the same listing */
  alsoFoundOn: string[]
  /** 0-100: how likely this is the right part for this car. Set by the ranking step. */
  score?: number
  /** Short explanation of the score */
  reason?: string
}

export type SourceStatus = {
  sourceId: string
  sourceName: string
  ok: boolean
  count: number
  ms: number
  error?: string
}

export type SourceRun = {
  at: string
  /** The queries this run searched for */
  queries: string[]
  statuses: SourceStatus[]
  /** Best first. `heuristic` means the AI ranking failed and a simple word match was used */
  ranking?: 'ai' | 'heuristic'
  results: SourceResult[]
}

export type SourceInfo = {
  id: string
  name: string
  kind: SourceKind
  description: string
  demo: boolean
  enabled: boolean
}
