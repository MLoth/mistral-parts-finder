import type { SourceProvider } from './types'
import { demoSource } from './providers/demo'

/**
 * Add a real source by writing a SourceProvider and listing it here, for example:
 * a web search API, an eBay API client, or a scraper built on politeFetch().
 */
export const SOURCES: SourceProvider[] = [demoSource]
