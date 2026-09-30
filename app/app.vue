<script setup lang="ts">
import { nl } from '@nuxt/ui/locale'

const title = 'Mistral Parts Finder'
const description = 'Vind de juiste onderdelen voor je klassieker, door Mistral Classics.'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'nl'
  }
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const { user, isAdmin, displayName, signOut } = useAuth()

const menuItems = computed(() => [
  [
    { label: 'Profiel', icon: 'i-lucide-user', to: '/profile' },
    { label: 'Instellingen', icon: 'i-lucide-settings', to: '/settings' }
  ],
  ...(isAdmin.value
    ? [[
        { label: 'Gebruikers', icon: 'i-lucide-users', to: '/admin/users' },
        { label: 'AI-providers', icon: 'i-lucide-sparkles', to: '/admin/ai' }
      ]]
    : []),
  [{ label: 'Uitloggen', icon: 'i-lucide-log-out', onSelect: onSignOut }]
])

async function onSignOut() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <UApp :locale="nl">
    <UHeader title="Mistral Parts Finder">
      <template #title>
        <AppLogo class="text-base" />
      </template>

      <template #right>
        <UColorModeButton />
        <UDropdownMenu
          v-if="user"
          :items="menuItems"
        >
          <UButton
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
          >
            <UAvatar
              :text="displayName.slice(0, 2).toUpperCase()"
              :src="user.photoURL ?? undefined"
              size="xs"
            />
            <span class="hidden sm:inline">{{ displayName }}</span>
          </UButton>
        </UDropdownMenu>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Mistral Classics
        </p>
      </template>

      <template #right>
        <UButton
          to="https://www.mistralclassics.com"
          target="_blank"
          label="mistralclassics.com"
          color="neutral"
          variant="link"
        />
      </template>
    </UFooter>
  </UApp>
</template>
