import type { SourceKind, SourceResult } from '#shared/types/sourcing'

export type SourceQuery = {
  /** Free-text search terms, best first */
  queries: string[]
  partNumbers: string[]
  car: { make: string, model: string, year: number | null }
  /** Max results wanted from this source */
  limit: number
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
  search(query: SourceQuery): Promise<RawResult[]>
}
