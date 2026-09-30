<script setup lang="ts">
const title = 'Mistral Parts Finder'
const description = 'Find the right parts for your classic car, by Mistral Classics.'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
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
    { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
  ],
  ...(isAdmin.value ? [[{ label: 'Users', icon: 'i-lucide-users', to: '/admin/users' }]] : []),
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: onSignOut }]
])

async function onSignOut() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
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
