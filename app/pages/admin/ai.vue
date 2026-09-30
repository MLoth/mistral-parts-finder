<script setup lang="ts">
import type { AiSettingsView, ProviderId, ProviderStatus, UsageSummary } from '#shared/types/ai'

definePageMeta({ middleware: 'admin' })

const api = useApi()
const toast = useToast()

const { data, refresh } = await useAsyncData(
  'admin-ai',
  () => api<{ settings: AiSettingsView, usage: UsageSummary }>('/api/admin/ai'),
  { server: false }
)
const settings = computed(() => data.value?.settings)
const usage = computed(() => data.value?.usage)

const drafts = reactive<Record<string, { apiKey: string, model: string }>>({})
watch(settings, (s) => {
  for (const p of s?.providers ?? []) drafts[p.id] ??= { apiKey: '', model: p.model }
}, { immediate: true })

const busy = ref<string | null>(null)

async function run(key: string, fn: () => Promise<unknown>, success: string) {
  busy.value = key
  try {
    await fn()
    toast.add({ title: success })
    await refresh()
  } catch (error) {
    toast.add({ title: 'Mislukt', description: (error as { statusMessage?: string }).statusMessage, color: 'error' })
  } finally {
    busy.value = null
  }
}

const save = (p: ProviderStatus) => run(`save-${p.id}`, async () => {
  const draft = drafts[p.id]!
  await api(`/api/admin/ai/providers/${p.id}`, { method: 'PUT', body: { model: draft.model, ...(draft.apiKey && { apiKey: draft.apiKey }) } })
  draft.apiKey = ''
}, 'Opgeslagen')

const remove = (p: ProviderStatus) => run(`del-${p.id}`, () => api(`/api/admin/ai/providers/${p.id}`, { method: 'DELETE' }), 'Sleutel verwijderd')

async function test(p: ProviderStatus) {
  busy.value = `test-${p.id}`
  try {
    const r = await api<{ ok: boolean, model?: string, reply?: string, error?: string }>(`/api/admin/ai/providers/${p.id}/test`, { method: 'POST' })
    toast.add(r.ok ? { title: 'Verbinding werkt', description: `${r.model} antwoordde: ${r.reply}` } : { title: 'Test mislukt', description: r.error, color: 'error' })
  } finally {
    busy.value = null
  }
}

const updateSettings = (body: Record<string, unknown>) => run('settings', () => api('/api/admin/ai', { method: 'PUT', body }), 'Instellingen opgeslagen')

const limit = ref<number | null>(null)
watch(settings, s => (limit.value = s?.monthlyLimitUsd ?? null), { immediate: true })

const money = (n: number) => `$${n.toFixed(2)}`
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <h1 class="text-2xl">
      AI-providers
    </h1>

    <UPageCard
      v-for="p in settings?.providers"
      :key="p.id"
      :title="p.name"
      :description="p.configured ? `Sleutel eindigend op ${p.keyLast4}` : 'Geen API-sleutel ingesteld'"
    >
      <div class="space-y-4">
        <UFormField
          :label="p.configured ? 'API-sleutel vervangen' : 'API-sleutel'"
          help="Versleuteld opgeslagen op de server en nooit meer getoond."
        >
          <UInput
            v-model="drafts[p.id]!.apiKey"
            type="password"
            autocomplete="off"
            placeholder="sk-ant-…"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Model">
          <USelect
            v-model="drafts[p.id]!.model"
            :items="p.models.map(m => ({ label: m.label, value: m.id }))"
            class="w-64"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Opslaan"
            :loading="busy === `save-${p.id}`"
            :disabled="!p.configured && !drafts[p.id]!.apiKey"
            @click="save(p)"
          />
          <template v-if="p.configured">
            <UButton
              label="Verbinding testen"
              color="neutral"
              variant="subtle"
              :loading="busy === `test-${p.id}`"
              @click="test(p)"
            />
            <UButton
              label="Sleutel verwijderen"
              color="error"
              variant="ghost"
              :loading="busy === `del-${p.id}`"
              @click="remove(p)"
            />
          </template>
        </div>
      </div>
    </UPageCard>

    <UPageCard
      title="Gedrag"
      description="Welke provider functies gebruiken en wat er gebeurt als die uitvalt."
    >
      <div class="space-y-4">
        <UFormField label="Standaardprovider">
          <USelect
            :model-value="settings?.defaultProvider ?? undefined"
            :items="(settings?.providers ?? []).filter(p => p.configured).map(p => ({ label: p.name, value: p.id }))"
            placeholder="Geen provider ingesteld"
            class="w-64"
            @update:model-value="updateSettings({ defaultProvider: $event as ProviderId })"
          />
        </UFormField>
        <USwitch
          :model-value="settings?.fallbackEnabled"
          label="Terugvallen op een andere provider als de standaardprovider overbelast is of niet werkt"
          @update:model-value="updateSettings({ fallbackEnabled: $event })"
        />
        <UFormField
          label="Maandbudget (USD)"
          help="Leeg laten voor geen limiet. Zoekopdrachten worden geblokkeerd zodra de geschatte kosten van de maand dit bedrag bereiken."
        >
          <div class="flex gap-2">
            <UInputNumber
              v-model="limit"
              :min="1"
              class="w-40"
            />
            <UButton
              label="Opslaan"
              color="neutral"
              variant="subtle"
              @click="updateSettings({ monthlyLimitUsd: limit || null })"
            />
          </div>
        </UFormField>
      </div>
    </UPageCard>

    <UPageCard
      v-if="usage"
      title="Gebruik, laatste 30 dagen"
      description="Geschat op basis van tokens en catalogusprijzen."
    >
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <dt class="text-sm text-muted">
            Verzoeken
          </dt>
          <dd class="text-xl">
            {{ usage.requests }} <span class="text-sm text-muted">({{ usage.failures }} mislukt)</span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            Tokens in / uit
          </dt>
          <dd class="text-xl">
            {{ usage.inputTokens.toLocaleString() }} / {{ usage.outputTokens.toLocaleString() }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            Geschatte kosten
          </dt>
          <dd class="text-xl">
            {{ money(usage.costUsd) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            Deze maand
          </dt>
          <dd class="text-xl">
            {{ money(usage.monthCostUsd) }}
          </dd>
        </div>
      </dl>
    </UPageCard>
  </UContainer>
</template>
