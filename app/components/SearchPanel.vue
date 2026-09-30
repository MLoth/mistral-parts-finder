<script setup lang="ts">
import type { PartSearch } from '#shared/types/search'
import type { SourceResult } from '#shared/types/sourcing'

const props = defineProps<{ base: string, search: PartSearch, savedIds: string[] }>()
const emit = defineEmits<{ changed: [], save: [result: SourceResult], adopt: [number: string] }>()

const api = useApi()
const toast = useToast()

const first = computed(() => props.search.turns[0]!)
const latest = computed(() => props.search.turns.at(-1)!)
const earlier = computed(() => props.search.turns.slice(1, -1))
const followUp = computed(() => props.search.turns.length > 1)
const hasQuestions = computed(() => latest.value.analysis.questions.length > 0)

const answer = ref('')
const answerImages = ref<UploadImage[]>([])
const refining = ref(false)
const finding = ref(false)

async function refine() {
  refining.value = true
  try {
    await api(`${props.base}/${props.search.id}/refine`, {
      method: 'POST',
      body: { answer: answer.value, images: answerImages.value.map(({ mediaType, base64 }) => ({ mediaType, base64 })) }
    })
    answer.value = ''
    answerImages.value = []
    emit('changed')
  } catch (error) {
    toast.add({ title: 'Verfijnen mislukt', description: apiError(error), color: 'error' })
  } finally {
    refining.value = false
  }
}

async function findSources() {
  finding.value = true
  try {
    await api(`${props.base}/${props.search.id}/sources`, { method: 'POST' })
    emit('changed')
  } catch (error) {
    toast.add({ title: 'Bronnen doorzoeken mislukt', description: apiError(error), color: 'error' })
  } finally {
    finding.value = false
  }
}
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <!-- Right on wide screens: what you asked and what the AI thinks. Stays in view while the results scroll. First on phones. -->
    <div class="space-y-8 lg:order-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pe-2">
      <section class="space-y-3">
        <StepHeading
          title="Jouw beschrijving"
          done
        />
        <div class="ms-10 rounded-md bg-elevated p-3 text-sm whitespace-pre-line">
          {{ first.userText || 'Alleen foto\'s' }}
          <span
            v-if="first.imageCount"
            class="mt-1 flex items-center gap-1 text-muted"
          >
            <UIcon name="i-lucide-camera" />
            {{ first.imageCount }} foto{{ first.imageCount === 1 ? '' : '\'s' }} meegestuurd
          </span>
        </div>
      </section>

      <section class="space-y-4">
        <StepHeading
          title="Wat de AI denkt"
          :hint="hasQuestions ? 'De AI heeft nog vragen om scherper te worden.' : 'Klopt dit niet? Vul hieronder aan.'"
          done
        />
        <div class="ms-10 space-y-4">
          <UCollapsible v-if="earlier.length || followUp">
            <UButton
              :label="`Eerdere stappen (${search.turns.length - 1})`"
              icon="i-lucide-history"
              size="xs"
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-chevron-down"
            />
            <template #content>
              <div class="mt-2 space-y-3 border-s border-default ps-4">
                <div
                  v-for="(turn, i) in search.turns.slice(0, -1)"
                  :key="i"
                  class="text-sm"
                >
                  <p
                    v-if="i > 0 && (turn.userText || turn.imageCount)"
                    class="text-muted"
                  >
                    Jij: {{ turn.userText || `${turn.imageCount} foto's` }}
                  </p>
                  <p>
                    AI dacht: <strong>{{ turn.analysis.partName }}</strong>
                    <span class="text-muted">({{ turn.analysis.confidence === 'high' ? 'hoge' : turn.analysis.confidence === 'medium' ? 'gemiddelde' : 'lage' }} zekerheid)</span>
                  </p>
                </div>
              </div>
            </template>
          </UCollapsible>

          <div
            v-if="followUp && (latest.userText || latest.imageCount)"
            class="ms-8 rounded-md bg-elevated p-3 text-sm whitespace-pre-line"
          >
            {{ latest.userText }}
            <span
              v-if="latest.imageCount"
              class="block text-muted"
            >{{ latest.imageCount }} foto{{ latest.imageCount === 1 ? '' : '\'s' }} meegestuurd</span>
          </div>

          <AnalysisCard :analysis="latest.analysis" />

          <div
            v-if="latest.analysis.possiblePartNumbers.length"
            class="flex flex-wrap items-center gap-2 text-sm"
          >
            <span class="text-muted">Overnemen als onderdeelnummer:</span>
            <UButton
              v-for="n in latest.analysis.possiblePartNumbers"
              :key="n"
              :label="n"
              size="xs"
              color="neutral"
              variant="subtle"
              @click="emit('adopt', n)"
            />
          </div>

          <form
            class="space-y-2"
            @submit.prevent="refine"
          >
            <UFormField :label="hasQuestions ? 'Beantwoord de vragen of geef meer informatie' : 'Aanvullen of corrigeren'">
              <UTextarea
                v-model="answer"
                :rows="2"
                class="w-full"
              />
            </UFormField>
            <ImagePicker v-model="answerImages" />
            <UButton
              type="submit"
              label="Herkenning verfijnen"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="subtle"
              :disabled="!answer.trim() && !answerImages.length"
              :loading="refining"
            />
          </form>
        </div>
      </section>
    </div>

    <!-- Left on wide screens: sources and results -->
    <section class="min-w-0 space-y-4 lg:order-1">
      <StepHeading
        title="Bronnen en resultaten"
        :hint="search.sources ? `Laatst doorzocht op ${new Date(search.sources.at).toLocaleString()}` : 'Zoek met deze herkenning naar winkels en verkopers.'"
        :done="!!search.sources"
      />
      <div class="ms-10 space-y-4">
        <UButton
          :label="search.sources ? 'Opnieuw doorzoeken' : 'Bronnen doorzoeken'"
          icon="i-lucide-store"
          size="lg"
          :color="search.sources ? 'neutral' : 'primary'"
          :variant="search.sources ? 'subtle' : 'solid'"
          :loading="finding"
          @click="findSources"
        />
        <SourceResults
          v-if="search.sources"
          :run="search.sources"
          :saved-ids="savedIds"
          @save="emit('save', $event)"
        />
      </div>
    </section>
  </div>
</template>
