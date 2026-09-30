import type { PartAnalysis } from '#shared/types/search'
import type { Part, Project } from '#shared/types/project'
import { partAnalysisSchema } from '#shared/utils/schemas'
import type { AiContentPart, AiMessage } from './types'
import { runAi } from './run'

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['partName', 'category', 'alternativeNames', 'possiblePartNumbers', 'confidence', 'explanation', 'questions', 'searchQueries'],
  properties: {
    partName: { type: 'string' },
    category: { type: 'string' },
    alternativeNames: { type: 'array', items: { type: 'string' } },
    possiblePartNumbers: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    explanation: { type: 'string' },
    questions: { type: 'array', items: { type: 'string' } },
    searchQueries: { type: 'array', items: { type: 'string' } }
  }
}

function systemPrompt(project: Project, part: Part) {
  const car = [project.year, project.make, project.model].filter(Boolean).join(' ') || 'onbekend'
  return `Je bent een ervaren specialist in onderdelen voor klassieke auto's en werkt voor Mistral Classics. Medewerkers beschrijven een onderdeel dat ze zoeken, soms vaag, soms met foto's. Jij bepaalt wat voor onderdeel het is, zodat er gericht naar gezocht kan worden.

Auto: ${car}
${project.notes ? `Projectnotities: ${project.notes}\n` : ''}Onderdeel in de lijst: ${part.name}${part.partNumber ? ` (nummer ${part.partNumber})` : ''}, aantal ${part.quantity}${part.notes ? `\nNotities bij het onderdeel: ${part.notes}` : ''}

Regels:
- Antwoord in het Nederlands. Onderdeelnamen mag je daarnaast in het Engels of Duits geven bij alternativeNames.
- Verzin nooit onderdeelnummers. Noem alleen nummers waar je redelijk zeker van bent, anders laat je possiblePartNumbers leeg.
- Zet confidence op low als je moet gokken, medium als het waarschijnlijk klopt en high als het duidelijk is.
- Is er te weinig informatie, stel dan maximaal 3 korte, concrete vragen in questions (bijvoorbeeld positie op de auto, afmetingen, of een foto van een specifieke kant). Is het duidelijk genoeg, laat questions dan leeg.
- searchQueries: 3 tot 6 zoektermen die goed werken in webshops en op marktplaatsen, in de taal die daar het meest oplevert (Nederlands, Engels of Duits), zo specifiek mogelijk voor deze auto.`
}

export type PriorTurn = { userText: string, analysis: PartAnalysis }

/** Asks the AI to identify the part, given the conversation so far and the newest input. */
export async function analysePart(opts: {
  project: Project
  part: Part
  history: PriorTurn[]
  userText: string
  images: { mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', base64: string }[]
  userUid: string
}): Promise<PartAnalysis> {
  const messages: AiMessage[] = opts.history.flatMap(t => [
    { role: 'user' as const, content: t.userText || '(alleen foto\'s)' },
    { role: 'assistant' as const, content: JSON.stringify(t.analysis) }
  ])

  const content: AiContentPart[] = [
    ...opts.images.map(i => ({ type: 'image' as const, mediaType: i.mediaType, base64: i.base64 })),
    { type: 'text', text: opts.userText || 'Zie de foto\'s.' }
  ]
  messages.push({ role: 'user', content })

  const result = await runAi({
    feature: 'part-search',
    system: systemPrompt(opts.project, opts.part),
    messages,
    jsonSchema: JSON_SCHEMA,
    maxTokens: 2000
  }, opts.userUid)

  const parsed = partAnalysisSchema.safeParse(result.json)
  if (!parsed.success) {
    throw createError({ statusCode: 502, statusMessage: 'De AI gaf een onverwacht antwoord. Probeer het opnieuw.' })
  }
  return parsed.data
}
