<script setup lang="ts">
import type {ApolloError, Group, MainEntities, Role, User} from "~/types";
import LoadingCover from "~/components/ui/LoadingCover.vue";
import ALL_GROUPS from '~/graphql/queries/AllGroups.graphql'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import ALL_ROLES from '~/graphql/queries/AllRoles.graphql'

import bindRolesService from '~/graphql/services/bindRolesService.js'
import bindGroupsService from '~/graphql/services/bindGroupsService.js'

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

const toast = useToast()

const opened = ref(false)

const allEntities: Ref<User[] | Role[] | Group[] | []> = ref([])
const chosenEntities: Ref<User[] | Role[] | Group[] | []> = ref([])

let source = ref('')
let target = ref('')

const modalTitle = ref('')
const searchText = ref('')

const isLoadingSubmit = ref(false)
const isLoadingList = ref(false)

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

const getAll = async (type: MainEntities): Promise<User[] | Role[] | Group[] | []> => {
  let query
  let listName: 'allUsers' | 'allGroups' | 'allRoles'
  switch (type) {
    case 'users':
      query = ALL_USERS
      listName = 'allUsers'
      break
    case 'groups':
      query = ALL_GROUPS
      listName = 'allGroups'
      break
    case 'roles':
      query = ALL_ROLES
      listName = 'allRoles'
      break
    default:
      query = ALL_USERS
      listName = 'allUsers'
  }

  const { data, error } = await useLazyAsyncQuery(query) as unknown as {
      data: Ref<'allUsers' | 'allGroups' | 'allRoles', []>,
      error: Ref<string>
    }

  if (error.value) {
    toast.add({
      title: 'Ошибка получения списка',
      description: error.value,
      duration: 5000,
      color: 'error'
    })
    return []
  } else {
    return data.value[listName] // ToDo: исправить тс
  }
}

const moveItem = <T extends User | Role | Group>(item: T, action: 'add' | 'remove'): void => {
  let from: T[]
  let to: T[]

  if (action === 'add') {
    from = allEntities.value as T[]
    to = chosenEntities.value as T[]
  } else {
    from = chosenEntities.value as T[]
    to = allEntities.value as T[]
  }

  const itemToMoveIndex = from.findIndex((entity) => entity.id === item.id)
  const itemToMove = from[itemToMoveIndex]
  if (itemToMove) {
    const existingItem = to.find((item) => item.id === itemToMove.id)
    if (!existingItem) {
      to.push(itemToMove)
    }
    from.splice(itemToMoveIndex, 1)
  }
}

const onSubmit = async () => {
  let bindAction
  let IdsKey = ''
  const sourceIds = chosenEntities.value.map((entity) => entity.id)
  switch ($props.listEditData.target) {
    case 'groups':
      bindAction = bindRolesService
      IdsKey = 'groupsIds'
      break
    case 'roles': {
      bindAction = bindGroupsService
      IdsKey = 'roleIds'
      break
    }
  }
  if (bindAction) {
    isLoadingSubmit.value = true
    try {
      await bindAction({
        userIds: [$props.listEditData.entityId],
        [IdsKey]: sourceIds
      })
    } catch (error: unknown) {
      const localError = error as ApolloError
      console.error(localError.message)
      toast.add({
        title: 'Ошибка привязки',
        description: localError.message,
        icon: 'i-lucide-check',
        color: 'error'
      })
    } finally {
      isLoadingSubmit.value = false
    }
  }
}

watch(() => $props.showModal, async () => {
  opened.value = $props.showModal
  if (opened.value) {
    source.value = ruSource($props.listEditData.source)
    target.value = ruTarget($props.listEditData.target)
    modalTitle.value = 'Изменить ' + target.value + ' ' + source.value
    if ($props.listEditData.target) {
      isLoadingList.value = true
      allEntities.value = [...await getAll($props.listEditData.target)]
      setTimeout(() => {
        isLoadingList.value = false
      }, 1000)
    }
    if ($props.listEditData.oldList && $props.listEditData.oldList.length) {
      chosenEntities.value = $props.listEditData.oldList
      const copyOfChosen = [...chosenEntities.value]
      copyOfChosen.forEach((entity) => {
        moveItem(entity, 'add')
      })
    }
  } else {
    // cleanup
    source.value = ''
    target.value = ''
    modalTitle.value = ''
    chosenEntities.value = []
    allEntities.value = []
    isLoadingList.value = false
    isLoadingSubmit.value = false
  }
})
</script>

<template>
  <UModal v-model:open="opened" :title="modalTitle">
    <template #body>

      <div class="flex">
        <div class="border-r border-light-gray pr-4 w-1/2">
          <div class="mb-4 flex gap-4 content-between items-center">
            <p class="text-muted">Все {{ target }}</p>
            <i class="text-muted text-xs" v-if="chosenEntities.length">Скрыто {{ chosenEntities.length }} выбранных</i>
          </div>

          <UInput
            v-model="searchText"
            variant="outline"
            class="mb-4"
            placeholder="Поиск"
          />

          <div class="list list--all">
            <LoadingCover :show="isLoadingList" />

            <UBadge
              v-for="entity in allEntities"
              :label="entity.name"
              class="pr-0 py-0 gap-2 overflow-hidden"
              variant="soft"
            >
              <template #trailing>
                <UButton
                  icon="ic-outline-plus"
                  class="rounded-none ml-auto"
                  variant="soft"
                  @click="moveItem(entity, 'add')"
                />
              </template>
            </UBadge>
          </div>
        </div>

        <div class="pl-4 w-1/2">
          <p class="text-muted mb-4">Выбранные {{ target }}</p>

          <div class="list list--chosen">
            <UBadge
              v-for="entity in chosenEntities"
              :label="entity.name"
              class="pr-0 py-0 gap-2 overflow-hidden"
              variant="soft"
            >
              <template #trailing>
                <UButton
                  icon="ic-outline-minus"
                  class="rounded-none ml-auto"
                  variant="soft"
                  @click="moveItem(entity, 'remove')"
                />
              </template>
            </UBadge>
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

        <UButton :disabled="isLoadingSubmit" @click="onSubmit">
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
    &--all {
      position: relative;
    }
    &--chosen {
      height: calc(100% - 40px);
    }
  }
</style>
