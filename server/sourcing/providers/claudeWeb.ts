import { estimateCostUsd } from '../../ai/registry'
import { configuredProviders, loadSettings } from '../../ai/settings'
import { logUsage, monthCostUsd } from '../../ai/usage'
import type { SourceProvider } from '../types'
import { parseWebResults } from './webParse'

/** Anthropic's price for a web search, on top of the tokens */
const USD_PER_SEARCH = 0.01
const MAX_SEARCHES = 4

/**
 * Searches the open web with Claude's built-in web search tool: no extra API key, but every
 * search costs money, so it starts switched off. Results are only kept when the search really returned the link.
 */
export const claudeWebSource: SourceProvider = {
  id: 'claude-web',
  name: 'Web (via Claude)',
  kind: 'webshop',
  description: 'Zoekt op het hele web naar aanbiedingen van winkels, marktplaatsen, forums en verkopers, met de webzoekfunctie van Claude.',
  demo: false,
  defaultEnabled: false,
  costNote: `Kost per zoekopdracht ongeveer ${MAX_SEARCHES} × $0,01 voor het zoeken (maximaal) plus de tokens van het model. Webzoeken moet ingeschakeld zijn in de Anthropic Console.`,
  timeoutMs: 90_000,
  // A retry would pay for the searches twice
  maxAttempts: 1,

  async search(query) {
    const provider = (await configuredProviders()).find(p => p.webSearch)
    if (!provider?.webSearch) throw new Error('Er is geen AI-provider met webzoeken ingesteld. Voeg een Claude-sleutel toe onder AI-providers.')

    const settings = await loadSettings()
    if (settings.monthlyLimitUsd !== null && (await monthCostUsd()) >= settings.monthlyLimitUsd) {
      throw new Error('Het maandbudget voor AI is bereikt.')
    }

    const car = [query.car.year, query.car.make, query.car.model].filter(Boolean).join(' ') || 'onbekend'
    const started = new Date().toISOString()
    const base = { at: started, provider: provider.id, model: provider.model, feature: 'web-source', userUid: query.userUid ?? 'system' }

    try {
      const result = await provider.webSearch({
        maxSearches: MAX_SEARCHES,
        maxTokens: 8000,
        system: 'Je zoekt op het web naar aanbiedingen van onderdelen voor klassieke auto\'s voor Mistral Classics. Je antwoordt uitsluitend met JSON.',
        prompt: `Zoek op het web naar aanbiedingen (webshops, marktplaatsen, forums, verkopers) voor dit onderdeel.

Auto: ${car}
Zoektermen: ${query.queries.slice(0, 4).join(' | ') || '-'}
Mogelijke onderdeelnummers: ${query.partNumbers.join(', ') || '-'}

Regels:
- Neem alleen pagina's op die je echt via de zoekopdracht hebt gevonden, met precies die link. Verzin nooit een link, prijs of gegeven.
- Alleen pagina's waar het onderdeel te koop is of waar iemand het aanbiedt. Geen algemene artikelen of handleidingen.
- Prijs alleen invullen als die op de pagina staat, met de muntcode (EUR, GBP, USD). Anders null.
- condition: new, used of refurbished als dat duidelijk is, anders null. countryCode: tweeletterige landcode als je die kent, anders null.
- Maximaal ${Math.min(query.limit, 12)} resultaten, de meest waarschijnlijke eerst.

Antwoord uitsluitend met JSON in dit formaat:
{"results":[{"title":"...","url":"https://...","kind":"webshop|marketplace|seller|forum","price":{"amount":0,"currency":"EUR"}|null,"condition":"new|used|refurbished|null","location":"stad of land of leeg","countryCode":"nl|null","snippet":"korte omschrijving"}]}`
      })

      await logUsage({
        ...base, inputTokens: result.inputTokens, outputTokens: result.outputTokens, ok: true,
        costUsd: estimateCostUsd(provider.id, provider.model, result.inputTokens, result.outputTokens) + result.searches * USD_PER_SEARCH
      })
      return parseWebResults(result.text, result.urls, query.limit)
    } catch (error) {
      await logUsage({ ...base, inputTokens: 0, outputTokens: 0, costUsd: 0, ok: false, error: error instanceof Error ? error.message : 'error' })
      throw error
    }
  }
}
