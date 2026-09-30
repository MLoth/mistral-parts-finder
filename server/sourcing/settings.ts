import type { SourceInfo } from '#shared/types/sourcing'
import { SOURCES } from './registry'
import { useFirestore } from '../utils/firebaseAdmin'

const ref = () => useFirestore().collection('settings').doc('sources')

type Stored = { overrides?: Record<string, boolean>, disabled?: string[] }

/** An admin's choice wins; otherwise the source's own default (on, unless it says it costs money). */
async function isEnabledMap() {
  const data = ((await ref().get()).data() ?? {}) as Stored
  return (id: string, defaultEnabled = true) => data.overrides?.[id] ?? (data.disabled?.includes(id) ? false : defaultEnabled)
}

export async function listSources(): Promise<SourceInfo[]> {
  const enabled = await isEnabledMap()
  return SOURCES.map(s => ({
    id: s.id, name: s.name, kind: s.kind, description: s.description, demo: s.demo, costNote: s.costNote,
    enabled: enabled(s.id, s.defaultEnabled)
  }))
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  await ref().set({ overrides: { [id]: enabled } }, { merge: true })
}

export async function enabledSources() {
  const enabled = await isEnabledMap()
  return SOURCES.filter(s => enabled(s.id, s.defaultEnabled))
}
