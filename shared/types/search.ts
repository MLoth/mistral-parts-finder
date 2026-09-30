import type { SourceResult, SourceRun } from './sourcing'

export type Confidence = 'low' | 'medium' | 'high'

/** What the AI concluded about the part. */
export type PartAnalysis = {
  partName: string
  category: string
  alternativeNames: string[]
  possiblePartNumbers: string[]
  confidence: Confidence
  explanation: string
  /** Follow-up questions that would sharpen the identification */
  questions: string[]
  /** Queries that would work well in webshops and on marketplaces */
  searchQueries: string[]
}

export type SearchTurn = {
  at: string
  /** What the user typed for this turn */
  userText: string
  /** Photos are not stored (yet), only how many were sent */
  imageCount: number
  analysis: PartAnalysis
}

export type JobStage = 'sources' | 'ranking'

/** A lookup in the sources that runs in the background. Progress is written to the search so the page can poll it. */
export type SearchJob = {
  id: string
  status: 'running' | 'done' | 'failed'
  stage: JobStage
  startedAt: string
  updatedAt: string
  finishedAt?: string
  /** Every source being searched, with how far it is */
  sources: { id: string, name: string, state: 'pending' | 'done' | 'failed', count?: number, ms?: number, error?: string, attempts?: number }[]
  /** Results found so far, before ranking */
  partial: SourceResult[]
  error?: string
}

export type PartSearch = {
  id: string
  createdAt: string
  createdBy: string
  createdByName: string
  turns: SearchTurn[]
  /** Latest lookup of the analysis in the sources */
  sources?: SourceRun
  job?: SearchJob
}
