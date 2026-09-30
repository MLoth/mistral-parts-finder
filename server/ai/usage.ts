import type { UsageSummary } from '#shared/types/ai'
import { useFirestore } from '../utils/firebaseAdmin'

export type UsageEntry = {
  at: string
  provider: string
  model: string
  feature: string
  userUid: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  ok: boolean
  error?: string
  fellBackFrom?: string
}

const col = () => useFirestore().collection('aiUsage')

export const logUsage = (entry: UsageEntry) => col().add(entry)

export async function monthCostUsd() {
  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  const snap = await col().where('at', '>=', start.toISOString()).get()
  return snap.docs.reduce((sum, d) => sum + ((d.data() as UsageEntry).costUsd ?? 0), 0)
}

export async function usageSummary(days = 30): Promise<UsageSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const snap = await col().where('at', '>=', since).get()
  const summary: UsageSummary = { days, requests: 0, failures: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, monthCostUsd: await monthCostUsd(), byProvider: {} }
  for (const doc of snap.docs) {
    const e = doc.data() as UsageEntry
    summary.requests++
    if (!e.ok) summary.failures++
    summary.inputTokens += e.inputTokens
    summary.outputTokens += e.outputTokens
    summary.costUsd += e.costUsd
    const p = (summary.byProvider[e.provider] ??= { requests: 0, costUsd: 0 })
    p.requests++
    p.costUsd += e.costUsd
  }
  return summary
}
