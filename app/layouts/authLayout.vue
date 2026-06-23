<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [{
  label: 'Пользователи',
  icon: 'i-lucide-user',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Группы',
  icon: 'i-lucide-users',
  to: '/groups',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Роли',
  icon: 'oui-app-users-roles',
  to: '/customers',
  onSelect: () => {
    open.value = false
  }
}] satisfies NavigationMenuItem[]
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <h2 v-if="!collapsed">
          Название компании
        </h2>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed"/>
      </template>
    </UDashboardSidebar>

    <slot/>

    <NotificationsSlideover/>
  </UDashboardGroup>
</template>
