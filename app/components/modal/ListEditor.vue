<script setup lang="ts">
import type {ApolloError, Group, MainEntities, Role, User} from "~/types";
import LoadingCover from "~/components/ui/LoadingCover.vue";
import ALL_GROUPS from '~/graphql/queries/AllGroups.graphql'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import ALL_ROLES from '~/graphql/queries/AllRoles.graphql'

import changeRolesService from '~/graphql/services/changeRolesService.js'
import changeGroupsService from '~/graphql/services/changeGroupsService.js'

type BindingTasks = {
  toBind: string[],
  toUnbind: string[]
}

type RequestPayload = {
  userIds: string[],
  toBind: string[],
  toUnbind: string[],
  runBind: boolean,
  runUnbind: boolean
}

const $props = defineProps<{
  showModal: boolean,
  listEditData: {
    oldList: User[] | Group[] | Role[] | [],
    source: MainEntities | '' // что меняем или с какой страницы вызвали модалку
    target: MainEntities | '' // у чего меняем
    entityId: string
  }
}>()

const $emits = defineEmits(['submit', 'close', 'refreshList'])

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

const getBindingTasks = (): BindingTasks => {
  const result: BindingTasks = {
    toBind: [],
    toUnbind: []
  }
  const oldList = [...$props.listEditData.oldList]
  const newList = [...chosenEntities.value]

  if (oldList.length) {
    // если элементы были изначально
    if (!chosenEntities.value.length) {
      // элементы были, но все удалили
      result.toUnbind = oldList.map((entity) => entity.id)
    } else {
      chosenEntities.value.forEach((chosenEntity) => {
        const newItem = !(oldList.find((oldEntity) => oldEntity.id === chosenEntity.id))
        if (newItem) {
          result.toBind.push(chosenEntity.id)
        }
      })

      oldList.forEach((oldEntity) => {
        const oldItem = !(newList.find((newEntity) => newEntity.id === oldEntity.id))
        if (oldItem) {
          result.toUnbind.push(oldEntity.id)
        }
      })
    }
  } else {
      // если элементов не было, то биндим все
      result.toBind = newList.map((entity) => entity.id)
  }
  return result
}

const getPayload = (): RequestPayload => {
  const tasks = getBindingTasks()

  const payload: RequestPayload = {
    userIds: [],
    toBind: tasks.toBind,
    toUnbind: tasks.toUnbind,
    runBind: tasks.toBind.length > 0,
    runUnbind: tasks.toUnbind.length > 0
  }

  if ($props.listEditData.source === 'users') {
    payload.userIds = [ $props.listEditData.entityId ]
  } else {
    const copyOfChosen = [...chosenEntities.value]
    const copyOfOld = [ ...$props.listEditData.oldList ]
    const toBindRaw = copyOfChosen.filter((chosenItem) => {
      return !(copyOfOld.find((oldItem) => oldItem.id === chosenItem.id ))
    })

    if (toBindRaw.length) {
      payload.toBind = [$props.listEditData.entityId]
      payload.userIds = toBindRaw.map((item) => item.id)
    } else {
      if (tasks.toUnbind.length) {
        payload.userIds = tasks.toUnbind
        payload.toUnbind = [$props.listEditData.entityId]
      }
    }
  }
  return payload
}

const onSubmit = async () => {
  let bindAction
  if (
    $props.listEditData.source === 'users' &&
    $props.listEditData.target === 'roles'
  ) {
    bindAction = changeRolesService
  } else if (
    $props.listEditData.source === 'users' &&
    $props.listEditData.target === 'groups'
  ) {
    bindAction = changeGroupsService
  } else if (
    $props.listEditData.source === 'roles' &&
    $props.listEditData.target === 'users'
  ) {
    bindAction = changeRolesService
  } else if (
    $props.listEditData.source === 'groups' &&
    $props.listEditData.target === 'users'
  ) {
    bindAction = changeGroupsService
  }

  if (bindAction) {
    const payload = getPayload()

    console.log(payload)

    if (payload.toBind.length || payload.toUnbind.length) {
      isLoadingSubmit.value = true
      try {
        await bindAction(payload)
        $emits('refreshList')
        $emits('close', $props.listEditData.entityId)
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
    } else {
      toast.add({
        title: 'Нет изменившихся списков',
        description: '',
        icon: 'i-lucide-check',
        color: 'info'
      })
    }
  }
}

watch(() => $props.showModal, async () => {
  opened.value = $props.showModal
  console.log($props.listEditData)
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
      chosenEntities.value = [...$props.listEditData.oldList]
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
        <LoadingCover :show="isLoadingSubmit" />

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
              class="pr-0 py-0 gap-2 shrink-0 overflow-hidden"
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
              class="pr-0 py-0 gap-2 shrink-0 overflow-hidden"
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
          :disabled="isLoadingSubmit"
          @click="$emits('close', listEditData.entityId)"
        />

        <UButton
          :disabled="isLoadingSubmit"
          @click="onSubmit"
        >
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
