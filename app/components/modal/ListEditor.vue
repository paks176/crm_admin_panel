<script setup lang="ts">
import type { Group, MainEntities, Role, User } from "~/types";
import LoadingCover from "~/components/ui/LoadingCover.vue";
import ALL_GROUPS from '~/graphql/queries/AllGroups.graphql'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import ALL_ROLES from '~/graphql/queries/AllRoles.graphql'
import {useApolloClient} from "#imports";
import USER from "~/graphql/queries/User.graphql";

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

const { client } = useApolloClient()

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

const getAll = async (type: MainEntities): Promise<void> => {
  let query
  switch (type) {
    case "users":
      query = ALL_USERS
      break
    case "groups":
      query = ALL_GROUPS
      break
    case "roles":
      query = ALL_ROLES
      break
    default:
      query = ALL_USERS
  }

  const response = await useLazyAsyncQuery(query)

  console.log(response)
}

let source = ref('')
let target = ref('')

const modalTitle = ref('')

const searchText = ref('')

const isLoadingSubmit = ref(false)
const isLoadingList = ref(false)

const allEntities: Ref<User[] | Role[] | Group[] | []> = ref([])

const onSubmit = () => {
  console.log('submit')
}

watch(() => $props.showModal, async () => {
  opened.value = $props.showModal
  source.value = ruSource($props.listEditData.source)
  target.value = ruTarget($props.listEditData.target)
  modalTitle.value = 'Изменить ' + target.value + ' ' + source.value
  if ($props.listEditData.target) {
    await getAll($props.listEditData.target)
  }
})
</script>

<template>
  <UModal v-model:open="opened" :title="modalTitle">
    <template #body>

      <div class="flex">
        <div class="border-r border-light-gray pr-4 w-1/2">
          <p class="text-muted mb-4">Все {{ target }}</p>

          <UInput
            v-model="searchText"
            variant="outline"
            class="mb-4"
            placeholder="Поиск"
          />

          <div class="list list--all">
            <LoadingCover :show="isLoadingList" />

          </div>
        </div>

        <div class="pl-4 w-1/2">
          <p class="text-muted mb-4">Выбранные {{ target }}</p>

          <div class="list list--chosen">
          </div>
        </div>
      </div>

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

<style scoped lang="scss">
  .list {
    padding: 12px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    height: 400px;
    border: 1px solid var(--color-light-gray);
    width: 100%;
    &--chosen {
      height: calc(100% - 40px);
    }
  }
</style>
