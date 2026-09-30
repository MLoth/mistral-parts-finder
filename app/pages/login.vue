<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

const { signInWithEmail, signInWithGoogle } = useAuth()
const toast = useToast()

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'password', type: 'password', label: 'Password', required: true }
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
    toast.add({ title: 'Sign in failed', description: 'Check your details and try again.', color: 'error' })
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
        title="Sign in"
        description="Mistral Classics staff only."
        :submit="{ label: 'Sign in' }"
        @submit="onSubmit"
      >
        <template #icon>
          <AppLogo class="text-lg" />
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
