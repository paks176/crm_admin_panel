<script setup lang="ts">
import type { LayoutKey } from "#build/types/nitro-layouts"

const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  },
  titleTemplate: '%s | AIDA CRM',
  title: 'Администрирование'
})

const { isAuthenticated } = authCheck()

const currentLayout = isAuthenticated ? 'auth-layout' : 'no-auth-layout' as LayoutKey
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout :name="currentLayout">
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
