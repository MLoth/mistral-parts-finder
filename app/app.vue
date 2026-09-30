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

const { user, isAdmin, signOut } = useAuth()

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
        <UButton
          v-if="isAdmin"
          to="/admin/users"
          label="Users"
          color="neutral"
          variant="ghost"
        />
        <UButton
          v-if="isAdmin"
          to="/admin/ai"
          label="AI"
          color="neutral"
          variant="ghost"
        />
        <UButton
          v-if="user"
          label="Sign out"
          color="neutral"
          variant="ghost"
          @click="onSignOut"
        />
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
