import type { SourceKind, SourceResult } from '#shared/types/sourcing'

export type SourceQuery = {
  /** Free-text search terms, best first */
  queries: string[]
  partNumbers: string[]
  car: { make: string, model: string, year: number | null }
  /** Max results wanted from this source */
  limit: number
  /** Who started the search, for usage logs */
  userUid?: string
}

/** A raw hit as a source knows it; the layer fills in ids and de-duplicates. */
export type RawResult = Omit<SourceResult, 'id' | 'sourceId' | 'sourceName' | 'kind' | 'alsoFoundOn'> & { kind?: SourceKind }

export interface SourceProvider {
  readonly id: string
  readonly name: string
  readonly kind: SourceKind
  readonly description: string
  /** Demo sources return made-up data and are labelled as such */
  readonly demo: boolean
  /** Sources that cost money or need care start switched off until an admin enables them. Default true. */
  readonly defaultEnabled?: boolean
  /** Shown to admins, for example what a search costs */
  readonly costNote?: string
  /** Time allowed for one attempt. Default 20 seconds. */
  readonly timeoutMs?: number
  /** Attempts before giving up. Default 2. Costly sources use 1. */
  readonly maxAttempts?: number
  search(query: SourceQuery): Promise<RawResult[]>
}
