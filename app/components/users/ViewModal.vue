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
        <div class="user-card">
          <div class="user-card__top flex items-center gap-4">
            <div class="user-card__avatar relative overflow-hidden rounded-[50%]">
              <img :src="user?.avatar ? user.avatar.file_id : '/images/default_avatar.jpg'" alt="Аватар">
              <UIcon name="absolute i-lucide-lightbulb" class="size-5" />
            </div>
            <h3>
              {{ user?.name }}
            </h3>
          </div>
          <pre>
          {{ user }}
        </pre>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<style scoped>
</style>
