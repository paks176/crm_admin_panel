<script setup lang="ts">
import type { User } from "~/types";
import type { Row } from "@tanstack/table-core";

defineProps<{
  users: Row<User>[] | [],
}>()

const open = ref(false)

async function onSubmit() {
  await new Promise(resolve => setTimeout(resolve, 1000))
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Добавить или убрать группы"
  >
    <slot />

    <template #body>
      <pre>
        {{ users }}
      </pre>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Delete"
          color="error"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
