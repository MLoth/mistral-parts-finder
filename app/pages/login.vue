<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

const { signInWithEmail, signInWithGoogle } = useAuth()
const toast = useToast()

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'E-mail', required: true },
  { name: 'password', type: 'password', label: 'Wachtwoord', required: true }
]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => run(signInWithGoogle)
}]

async function run(fn: () => Promise<unknown>) {
  try {
    await fn()
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Inloggen mislukt', description: 'Controleer je gegevens en probeer het opnieuw.', color: 'error' })
  }
}

function onSubmit(event: FormSubmitEvent<{ email: string, password: string }>) {
  return run(() => signInWithEmail(event.data.email, event.data.password))
}
</script>

<template>
  <div class="flex items-center justify-center p-4 py-16">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :fields="fields"
        :providers="providers"
        separator="of"
        title="Inloggen"
        description="Alleen voor medewerkers van Mistral Classics."
        :submit="{ label: 'Inloggen' }"
        @submit="onSubmit"
      >
        <template #icon>
          <AppLogo class="text-lg" />
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
