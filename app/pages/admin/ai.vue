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
    toast.add({ title: 'Failed', description: (error as { statusMessage?: string }).statusMessage, color: 'error' })
  } finally {
    busy.value = null
  }
}

const save = (p: ProviderStatus) => run(`save-${p.id}`, async () => {
  const draft = drafts[p.id]!
  await api(`/api/admin/ai/providers/${p.id}`, { method: 'PUT', body: { model: draft.model, ...(draft.apiKey && { apiKey: draft.apiKey }) } })
  draft.apiKey = ''
}, 'Saved')

const remove = (p: ProviderStatus) => run(`del-${p.id}`, () => api(`/api/admin/ai/providers/${p.id}`, { method: 'DELETE' }), 'Key removed')

async function test(p: ProviderStatus) {
  busy.value = `test-${p.id}`
  try {
    const r = await api<{ ok: boolean, model?: string, reply?: string, error?: string }>(`/api/admin/ai/providers/${p.id}/test`, { method: 'POST' })
    toast.add(r.ok ? { title: 'Connection works', description: `${r.model} replied: ${r.reply}` } : { title: 'Test failed', description: r.error, color: 'error' })
  } finally {
    busy.value = null
  }
}

const updateSettings = (body: Record<string, unknown>) => run('settings', () => api('/api/admin/ai', { method: 'PUT', body }), 'Settings saved')

const limit = ref<number | null>(null)
watch(settings, s => (limit.value = s?.monthlyLimitUsd ?? null), { immediate: true })

const money = (n: number) => `$${n.toFixed(2)}`
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <h1 class="text-2xl">
      AI providers
    </h1>

    <UPageCard
      v-for="p in settings?.providers"
      :key="p.id"
      :title="p.name"
      :description="p.configured ? `Key ending in ${p.keyLast4}` : 'No API key configured'"
    >
      <div class="space-y-4">
        <UFormField
          :label="p.configured ? 'Replace API key' : 'API key'"
          help="Stored encrypted on the server. It is never shown again."
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
            label="Save"
            :loading="busy === `save-${p.id}`"
            :disabled="!p.configured && !drafts[p.id]!.apiKey"
            @click="save(p)"
          />
          <template v-if="p.configured">
            <UButton
              label="Test connection"
              color="neutral"
              variant="subtle"
              :loading="busy === `test-${p.id}`"
              @click="test(p)"
            />
            <UButton
              label="Remove key"
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
      title="Behaviour"
      description="Which provider features use, and what happens when it fails."
    >
      <div class="space-y-4">
        <UFormField label="Default provider">
          <USelect
            :model-value="settings?.defaultProvider ?? undefined"
            :items="(settings?.providers ?? []).filter(p => p.configured).map(p => ({ label: p.name, value: p.id }))"
            placeholder="No provider configured"
            class="w-64"
            @update:model-value="updateSettings({ defaultProvider: $event as ProviderId })"
          />
        </UFormField>
        <USwitch
          :model-value="settings?.fallbackEnabled"
          label="Fall back to another configured provider when the default is rate limited or down"
          @update:model-value="updateSettings({ fallbackEnabled: $event })"
        />
        <UFormField
          label="Monthly budget (USD)"
          help="Leave empty for no limit. Searches are blocked once the month's estimated cost reaches it."
        >
          <div class="flex gap-2">
            <UInputNumber
              v-model="limit"
              :min="1"
              class="w-40"
            />
            <UButton
              label="Save"
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
      title="Usage, last 30 days"
      description="Estimated from token counts and list prices."
    >
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <dt class="text-sm text-muted">
            Requests
          </dt>
          <dd class="text-xl">
            {{ usage.requests }} <span class="text-sm text-muted">({{ usage.failures }} failed)</span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            Tokens in / out
          </dt>
          <dd class="text-xl">
            {{ usage.inputTokens.toLocaleString() }} / {{ usage.outputTokens.toLocaleString() }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            Estimated cost
          </dt>
          <dd class="text-xl">
            {{ money(usage.costUsd) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            This month
          </dt>
          <dd class="text-xl">
            {{ money(usage.monthCostUsd) }}
          </dd>
        </div>
      </dl>
    </UPageCard>
  </UContainer>
</template>
