<script setup lang="ts">
import type {Group, MainEntities, Role, User} from "~/types";
import LoadingCover from "~/components/ui/LoadingCover.vue";
import ALL_GROUPS from '~/graphql/queries/AllGroups.graphql'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import ALL_ROLES from '~/graphql/queries/AllRoles.graphql'

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

  console.log(data)

  if (error.value) {
    toast.add({
      title: 'Ошибка получения списка',
      description: error.value,
      duration: 5000,
      color: 'error'
    })
    return []
  } else {
    return data.value[listName]
  }
}

let source = ref('')
let target = ref('')

const modalTitle = ref('')

const searchText = ref('')

const isLoadingSubmit = ref(false)
const isLoadingList = ref(false)

const allEntities: Ref<User[] | Role[] | Group[] | []> = ref([])
const chosenEntities: Ref<User[] | Role[] | Group[] | []> = ref([])

const onSubmit = () => {
  console.log('submit')
}

watch(() => $props.showModal, async () => {
  opened.value = $props.showModal
  source.value = ruSource($props.listEditData.source)
  target.value = ruTarget($props.listEditData.target)
  modalTitle.value = 'Изменить ' + target.value + ' ' + source.value
  if ($props.listEditData.target) {
    isLoadingList.value = true
    allEntities.value = await getAll($props.listEditData.target)
    console.log(allEntities.value)
    setTimeout(() => {
      isLoadingList.value = false
    }, 1000)
  }

  if ($props.listEditData.oldList && $props.listEditData.oldList.length) {
    chosenEntities.value = $props.listEditData.oldList
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
                  @click=""
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
                  @click=""
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
    &--all {
      position: relative;
    }
    &--chosen {
      height: calc(100% - 40px);
    }
  }
</style>
