<script setup lang="ts">
import type { User } from "~/types";

const $props = defineProps<{
  user: User | null,
}>()

const opened = ref(false)

watch(() => $props.user, () => {
  if ($props.user && $props.user.id) {
    opened.value = true
  }
})
</script>

<template>
  <UModal v-model:open="opened" :title="user?.name">
    <template #body>
      <UCard variant="soft">
        <pre>
          {{ user }}
        </pre>
      </UCard>
    </template>
  </UModal>
</template>

<style scoped>

</style>
