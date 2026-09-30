import type { SourceInfo } from '#shared/types/sourcing'
import { SOURCES } from './registry'
import { useFirestore } from '../utils/firebaseAdmin'

const ref = () => useFirestore().collection('settings').doc('sources')

/** Sources are enabled unless an admin has turned them off. */
async function disabledIds(): Promise<string[]> {
  return ((await ref().get()).data()?.disabled as string[] | undefined) ?? []
}

export async function listSources(): Promise<SourceInfo[]> {
  const disabled = await disabledIds()
  return SOURCES.map(s => ({ id: s.id, name: s.name, kind: s.kind, description: s.description, demo: s.demo, enabled: !disabled.includes(s.id) }))
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  const disabled = new Set(await disabledIds())
  if (enabled) disabled.delete(id)
  else disabled.add(id)
  await ref().set({ disabled: [...disabled] })
}

export async function enabledSources() {
  const disabled = await disabledIds()
  return SOURCES.filter(s => !disabled.includes(s.id))
}
