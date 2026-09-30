<script setup lang="ts">
import type { SourceInfo } from '#shared/types/sourcing'

definePageMeta({ middleware: 'admin' })

const api = useApi()
const toast = useToast()

const { data: sources, refresh } = await useAsyncData('admin-sources', () => api<SourceInfo[]>('/api/admin/sources'), { server: false })

const KIND: Record<SourceInfo['kind'], string> = { webshop: 'Webshop', marketplace: 'Marktplaats', seller: 'Verkoper', forum: 'Forum' }

async function toggle(source: SourceInfo, enabled: boolean) {
  try {
    await api(`/api/admin/sources/${source.id}`, { method: 'PUT', body: { enabled } })
    await refresh()
  } catch {
    toast.add({ title: 'Opslaan mislukt', color: 'error' })
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-3xl space-y-6">
    <h1 class="text-2xl">
      Bronnen
    </h1>
    <p class="text-muted">
      Plekken waar naar onderdelen gezocht wordt. Schakel een bron uit om hem over te slaan.
    </p>

    <UPageCard
      v-for="source in sources"
      :key="source.id"
      :title="source.name"
      :description="source.description"
    >
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <UBadge
            :label="KIND[source.kind]"
            color="neutral"
            variant="subtle"
          />
          <UBadge
            v-if="source.demo"
            label="Demo"
            color="warning"
            variant="subtle"
          />
        </div>
        <USwitch
          :model-value="source.enabled"
          :label="source.enabled ? 'Ingeschakeld' : 'Uitgeschakeld'"
          @update:model-value="toggle(source, $event)"
        />
      </div>
    </UPageCard>
  </UContainer>
</template>
