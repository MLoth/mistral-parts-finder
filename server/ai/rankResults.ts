import type { PartAnalysis } from '#shared/types/search'
import type { Project } from '#shared/types/project'
import type { SourceResult, SourceRun } from '#shared/types/sourcing'
import { rankingSchema } from '#shared/utils/schemas'
import { runAi } from './run'

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['rankings'],
  properties: {
    rankings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['index', 'score', 'reason'],
        properties: { index: { type: 'integer' }, score: { type: 'integer' }, reason: { type: 'string' } }
      }
    }
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function describe(r: SourceResult, i: number) {
  const price = r.price ? `${r.price.amount} ${r.price.currency}` : 'prijs onbekend'
  return `[${i}] ${r.title} | ${r.sourceName} (${r.kind}) | ${price} | ${r.condition ?? 'staat onbekend'} | ${r.location || 'locatie onbekend'}${r.snippet ? ` | ${r.snippet}` : ''}`
}

/** Simple fallback when the AI ranking fails: how many search words appear in the title. */
function heuristicScore(r: SourceResult, analysis: PartAnalysis) {
  const words = new Set([analysis.partName, ...analysis.alternativeNames, ...analysis.searchQueries]
    .join(' ').toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const title = r.title.toLowerCase()
  const hits = [...words].filter(w => title.includes(w)).length
  const numberHit = analysis.possiblePartNumbers.some(n => title.includes(n.toLowerCase()))
  return clamp(20 + (words.size ? (hits / words.size) * 50 : 0) + (numberHit ? 20 : 0) + (r.price ? 5 : 0))
}

/**
 * Scores every result on how likely it is the right part, explains why, and sorts best first.
 * Falls back to a word-match heuristic if the AI call fails, so results are never lost.
 */
export async function rankResults(run: SourceRun, analysis: PartAnalysis, project: Project, userUid: string): Promise<SourceRun> {
  if (!run.results.length) return { ...run, ranking: 'ai' }

  let ranked: SourceResult[]
  let ranking: 'ai' | 'heuristic' = 'ai'

  try {
    const car = [project.year, project.make, project.model].filter(Boolean).join(' ') || 'onbekend'
    const result = await runAi({
      feature: 'rank-results',
      maxTokens: 6000,
      jsonSchema: JSON_SCHEMA,
      system: `Je beoordeelt zoekresultaten voor een onderdeel van een klassieke auto voor Mistral Classics. Geef elk resultaat een score van 0 tot 100 voor de kans dat het de juiste aanbieding is voor dit onderdeel en deze auto, met een korte uitleg in het Nederlands (maximaal 25 woorden).

Let op: overeenkomst van titel met het onderdeel, of een onderdeelnummer klopt, of het bij deze auto past, de staat en of de prijs aannemelijk is, en hoe betrouwbaar het soort bron lijkt. Verzin geen feiten die niet in het resultaat staan. Bij twijfel of weinig informatie geef je een lagere score en zeg je dat. Geef precies één beoordeling per resultaat, met het nummer uit de lijst als index.`,
      messages: [{
        role: 'user',
        content: `Auto: ${car}
Onderdeel: ${analysis.partName} (${analysis.category})
Ook bekend als: ${analysis.alternativeNames.join(', ') || '-'}
Mogelijke onderdeelnummers: ${analysis.possiblePartNumbers.join(', ') || '-'}

Resultaten:
${run.results.map(describe).join('\n')}`
      }]
    }, userUid)

    const parsed = rankingSchema.parse(result.json)
    const byIndex = new Map(parsed.rankings.map(r => [r.index, r]))
    ranked = run.results.map((r, i) => {
      const hit = byIndex.get(i)
      return hit ? { ...r, score: clamp(hit.score), reason: hit.reason } : { ...r, score: heuristicScore(r, analysis), reason: 'Niet beoordeeld door de AI; geschat op basis van de zoektermen.' }
    })
  } catch {
    ranking = 'heuristic'
    ranked = run.results.map(r => ({ ...r, score: heuristicScore(r, analysis), reason: 'De AI-beoordeling mislukte; geschat op basis van overeenkomst met de zoektermen.' }))
  }

  return { ...run, ranking, results: ranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) }
}
