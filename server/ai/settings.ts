import type { AiSettingsView, ProviderId } from '#shared/types/ai'
import { PROVIDERS } from './registry'
import { decrypt } from './crypto'
import type { AiProvider } from './types'
import { useFirestore } from '../utils/firebaseAdmin'

type StoredProvider = { apiKeyEnc: string, keyLast4: string, model: string, updatedAt: string, updatedBy: string }
export type StoredSettings = {
  defaultProvider: ProviderId | null
  fallbackEnabled: boolean
  monthlyLimitUsd: number | null
  providers: Partial<Record<ProviderId, StoredProvider>>
}

const ref = () => useFirestore().collection('settings').doc('ai')

export async function loadSettings(): Promise<StoredSettings> {
  const data = (await ref().get()).data() as Partial<StoredSettings> | undefined
  return {
    defaultProvider: data?.defaultProvider ?? null,
    fallbackEnabled: data?.fallbackEnabled ?? false,
    monthlyLimitUsd: data?.monthlyLimitUsd ?? null,
    providers: data?.providers ?? {}
  }
}

export async function saveSettings(patch: Partial<StoredSettings>) {
  await ref().set(patch, { merge: true })
}

export async function saveProvider(id: ProviderId, value: StoredProvider) {
  await ref().set({ providers: { [id]: value } }, { merge: true })
}

export async function removeProvider(id: ProviderId) {
  const { FieldValue } = await import('firebase-admin/firestore')
  await ref().update({ [`providers.${id}`]: FieldValue.delete() })
}

/** Safe for the client: never includes keys, only the last 4 characters. */
export async function settingsView(): Promise<AiSettingsView> {
  const s = await loadSettings()
  return {
    defaultProvider: s.defaultProvider,
    fallbackEnabled: s.fallbackEnabled,
    monthlyLimitUsd: s.monthlyLimitUsd,
    providers: Object.values(PROVIDERS).map((def) => {
      const stored = s.providers[def.id]
      return {
        id: def.id,
        name: def.name,
        models: def.models.map(m => ({ id: m.id, label: m.label })),
        configured: !!stored,
        keyLast4: stored?.keyLast4 ?? null,
        model: stored?.model ?? def.models[0]!.id,
        updatedAt: stored?.updatedAt ?? null
      }
    })
  }
}

/** Providers that have a key, default first. */
export async function configuredProviders(): Promise<AiProvider[]> {
  const s = await loadSettings()
  const ids = (Object.keys(s.providers) as ProviderId[]).sort(a => (a === s.defaultProvider ? -1 : 1))
  return ids.map(id => PROVIDERS[id].create(decrypt(s.providers[id]!.apiKeyEnc), s.providers[id]!.model))
}
