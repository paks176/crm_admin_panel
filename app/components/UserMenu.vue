<script setup lang="ts">
import ME from '~/graphql/queries/Me.graphql'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ApolloError, QueryResponse } from '~/types'
import { useToast } from "#imports";

defineProps<{
  collapsed?: boolean
}>()

const toast = useToast()

const user = ref({})

try {
  const response: QueryResponse<'me', object> = await useAsyncQuery(ME)

  if (response.data.value.me) {
    user.value = response.data.value.me
  }

} catch (error) {
  const localError = error as ApolloError
  console.error(localError.message)
  toast.add({
    title: 'Ошибка',
    description: localError.message,
    icon: 'i-lucide-check',
    color: 'error'
  })
}

const { logout } = authCheck()

const items = computed<DropdownMenuItem[]>(() => (
  [
    {
      type: 'label',
      label: user.value.name,
    },
    {
      label: 'Выйти',
      icon: 'i-lucide-user',
      onSelect: (e) => {
        e.preventDefault()
        logout()
      }
    }
  ]
))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
