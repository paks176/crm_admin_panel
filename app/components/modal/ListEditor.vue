<script setup lang="ts">
import type { Group, MainEntities, Role, User } from "~/types";

const $props = defineProps<{
  showModal: boolean,
  listEditData: {
    oldList: User[] | Group[] | Role[] | [],
    source: MainEntities | '' // что меняем
    target: MainEntities | '' // у чего меняем
    entityId: string
  }
}>()

const $emits = defineEmits(['submit', 'cancel'])

const opened = ref(false)

const ruSource = (source: string) => {
  switch (source) {
    case 'users':
      return 'пользователя'
    case 'groups':
      return 'группы'
    case 'roles':
      return 'роли'
    default:
      return ''
  }
}

const ruTarget = (target: string) => {
  switch (target) {
    case 'users':
      return 'пользователей'
    case 'groups':
      return 'группы'
    case 'roles':
      return 'роли'
    default:
      return ''
  }
}

const modalTitle = ref('')

const isLoading = ref(false)

const onSubmit = () => {
  console.log('submit')
}

watch(() => $props.showModal, () => {
  opened.value = $props.showModal
  const source = ruSource($props.listEditData.source)
  const target = ruTarget($props.listEditData.target)
  modalTitle.value = 'Изменить ' + target + ' ' + source
})
</script>

<template>
  <UModal v-model:open="opened" :title="modalTitle">
    <template #body>
      {{ listEditData.oldList }}

      <div class="mt-8 gap-2 flex justify-end">
        <UButton
          label="Отмена"
          color="neutral"
          variant="subtle"
          @click="$emits('cancel', listEditData.entityId)"
        />

        <UButton>
          Cохранить
        </UButton>
      </div>
    </template>
  </UModal>
</template>
