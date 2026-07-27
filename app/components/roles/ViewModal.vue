<script setup lang="ts">
import type {ApolloError, Role, User} from "~/types";
import ROLE from '~/graphql/queries/Role.graphql'
import LoadingCover from "~/components/ui/LoadingCover.vue";
import {useApolloClient} from '#imports'

const toast = useToast()

const $props = defineProps<{
  roleId: string,
}>()

const $emits = defineEmits(['refreshGroupsList', 'editList'])

const opened = ref(false)

const formRef = useTemplateRef('userFormRef')

const localCopyRole = reactive<Role>({
  id: '',
  name: '',
  transliterate_name: '',
  members: [],
  documents: {}
})

const roleInfo = reactive({
  fullname: ref({
    value: '',
    oldValue: '',
    edit: false
  }),
  post: ref({
    value: '',
    oldValue: '',
    edit: false
  }),
  emails: ref([
    {
      value: '',
      oldValue: '',
      edit: false
    }
  ]),
  phones: ref([
    {
      value: '',
      oldValue: '',
      edit: false
    }
  ]),
  addresses: ref([
    {
      value: '',
      oldValue: '',
      edit: false
    }
  ]),
  user_id: ''
})

const hasChanges = ref(false)

const isLoading = ref(false)

const showEditListDialog = (target: string, oldList: User[] | []): void => {
  opened.value = false
  $emits('editList', {
    entityId: $props.roleId,
    source: 'roles',
    target,
    oldList
  })
}

const {client} = useApolloClient()

const switchEdit = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    roleInfo[property][index].edit = !roleInfo[property][index].edit
  } else roleInfo[property].edit = !roleInfo[property].edit
}

const addFieldAndFocus = (property: string): void => {
  if (property) {
    roleInfo[property].forEach((property) => {
      property.edit = false
    })
    roleInfo[property].push({
      value: '',
      oldValue: '',
      edit: true
    })
    nextTick(() => {
      if (formRef.value) {
        const inputs = formRef.value.querySelectorAll(`[name="input-${property}"]`)

        if (inputs.length) {
          inputs[inputs.length - 1].focus()
        }
      }
    })
  }
}

const cancelChange = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    const targetItem = roleInfo[property][index]
    if (targetItem) {
      if (!targetItem.oldValue && index > 0) {
        roleInfo[property].splice(index, 1)
      } else {
        targetItem.value = targetItem.oldValue
      }
    }
  } else {
    roleInfo[property].value = roleInfo[property].oldValue
  }
}

const clearField = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    if (index === 0) {
      roleInfo[property][0].value = ''
    } else roleInfo[property].splice(index, 1)
  } else {
    roleInfo[property].value = ''
  }
}

const checkIfAllUnfocused = (property: string) => {
  return !roleInfo[property].some((item) => item.edit);
}

const checkLengthAndValuesDifference = (): boolean => {
  const fields = ['phones', 'addresses', 'emails']

  for (const arrayField of fields) {
    const currentField = roleInfo[arrayField]
    const propField = localCopyRole.info[arrayField]

    if (
      currentField.length === 1 &&
      propField.length === 0 &&
      currentField[0].value === ''
    ) {
      continue
    }

    for (const [index, item] of currentField.entries()) {
      if (!propField[index]) {
        if (!!item.value) {
          return true
        } else continue
      }

      if (item.value !== propField[index]) {
        return true
      }
    }
  }

  return false
}

const checkAnyLocalChanges = (): boolean => {
  let result = false;
  ['phones', 'addresses', 'emails'].forEach((arrayField) => {
    if (roleInfo[arrayField].length > 1) {
      result = true
      return
    }

    if (roleInfo[arrayField].some((field) => field.value)) {
      result = true
    }
  })

  if (!result) {
    result = !!(roleInfo.post.value || roleInfo.fullname.value)
  }

  return result
}

const checkChanges = () => {
  if ($props.roleId) {
    if (localCopyRole.info) {
      if (localCopyRole.info?.fullname || localCopyRole.info?.post) {
        if (localCopyRole.info?.fullname && (roleInfo.fullname.value !== localCopyRole.info.fullname)) {
          hasChanges.value = true
          return
        }
        if (localCopyRole.info?.post && (roleInfo.post.value !== localCopyRole.info.post)) {
          hasChanges.value = true
          return
        }
        hasChanges.value = checkLengthAndValuesDifference()
      }
    } else hasChanges.value = checkAnyLocalChanges()
  }
}

const getRole = async (roleId: string): Promise<void> => {
  try {
    const {data} = await client.query({
      query: ROLE,
      variables: {
        roleId: roleId
      },
      fetchPolicy: 'no-cache'
    })

    if (data?.Role) {
      applyRoleData(data.Role)
    }
  } catch (error: unknown) {
    const localError = error as ApolloError
    console.error(localError.message)
    isLoading.value = false
    toast.add({
      title: 'Ошибка получения пользователя',
      description: localError.message,
      icon: 'i-lucide-check',
      color: 'error'
    })
  }
}

const resetRoleData = () => {
  localCopyRole.id = ''
  localCopyRole.name = ''
  localCopyRole.transliterate_name = ''
  localCopyRole.members = []
  localCopyRole.documents = {}
}

const applyRoleData = (roleData: Role): void => {
  localCopyRole.id = roleData.id
  localCopyRole.name = roleData.name
  localCopyRole.transliterate_name = roleData.transliterate_name
  localCopyRole.members = roleData.members
  localCopyRole.documents = roleData.documents
}

const unwatchChanges = watch(roleInfo, () => {
  checkChanges()
}, {deep: true})

const groupCardKey = ref(0)

watch(() => $props.roleId, async () => {
  if ($props.roleId) {
    isLoading.value = true
    hasChanges.value = false
    opened.value = true
    await getRole($props.roleId)
    isLoading.value = false
  }
})

watch(opened, () => {
  if (!opened.value) {

    unwatchChanges()

    if (hasChanges.value) {
      $emits('refreshGroupsList')
    }

    // ToDo Сброс аватара когда будет аватар
    setTimeout(() => {
      resetRoleData()
    }, 1000)
  }
})
</script>

<template>
  <UModal v-model:open="opened" title="Группа">
    <template #body>
      <UCard class="relative" variant="soft">
        <LoadingCover :show="isLoading"/>
        <div class="user-card" ref="userFormRef" :key="groupCardKey">
          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">ID:</p>
            <p class="font-semibold">{{ localCopyRole?.id }}</p>
          </div>

          <hr>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Название:</p>
            <p class="font-semibold">{{ localCopyRole?.name }}</p>
          </div>

          <hr>

          <div v-if="localCopyRole.transliterate_name" class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Название на латинице:</p>
            <p class="font-semibold">{{ localCopyRole.transliterate_name }}</p>
          </div>

          <hr v-if="localCopyRole.transliterate_name">

          <div v-if="localCopyRole.members.length" class="user-card__item my-5">
            <p class="w-1/4 mb-3">Участники:</p>
            <div class="flex wrap gap-2">
              <UBadge
                v-for="user in localCopyRole.members.slice(0, 3)"
                :label="user.name"
                variant="soft"
              />
            </div>

            <details class="my-3" v-if="localCopyRole.members.length > 3">
              <summary class="mb-3">
                <span class="font-semibold cursor-pointer">Еще</span>
              </summary>
              <div class="flex wrap gap-2">
                <UBadge
                  v-for="user in localCopyRole.members.slice(3)"
                  :label="user.name"
                  variant="soft"
                />
              </div>
            </details>
          </div>

          <UButton
            class="mb-3"
            @click="showEditListDialog('users', localCopyRole.members)"
          >
            Добавить/убрать роль у пользователей
          </UButton>

          <hr v-if="localCopyRole.members.length">

          <div v-if="Object.keys(localCopyRole.documents).length" class="user-card__item my-5">
            <details>
              <summary class="mb-3">
                <span class="font-semibold cursor-pointer">Права участников с ролью</span>
              </summary>
              <table class="tg">
                <thead>
                <tr>
                  <th class="tg-0lax"></th>
                  <th class="tg-0lax"></th>
                  <th class="tg-0lax">Чтение</th>
                  <th class="tg-0lax">Создание</th>
                  <th class="tg-0lax">Обновление</th>
                  <th class="tg-0lax">Удаление</th>
                </tr>
                </thead>
                <tbody>
                <template v-for="(value, key) of localCopyRole.documents">
                  <tr>
                    <td class="tg-0lax" rowspan="2">{{ key }}</td>
                    <td class="tg-0lax">Объект</td>
                    <td class="tg-0lax">{{ value.one.actions.read ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.one.actions.create ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.one.actions.update ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.one.actions.delete ? '✅️' : '❌' }}</td>
                  </tr>
                  <tr>
                    <td class="tg-0lax">Список</td>
                    <td class="tg-0lax">{{ value.many.actions.read ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.many.actions.create ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.many.actions.update ? '✅️' : '❌' }}</td>
                    <td class="tg-0lax">{{ value.many.actions.delete ? '✅️' : '❌' }}</td>
                  </tr>
                </template>
                </tbody>
              </table>
            </details>
          </div>

          <div class="mt-8 flex justify-end">
            <UButton
              :disabled="!hasChanges"
            >
              Применить изменения
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<style scoped lang="scss">
.user-card {
  .iconify {
    background-color: white;
  }

  &__edit {
    &__avatar {
      opacity: 0;
      background-color: rgba(0, 0, 0, 0.3);

      &:hover {
        opacity: 1;
      }
    }
  }
}

.tg {
  border-collapse: collapse;
  border-spacing: 0;
}

.tg td {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  overflow: hidden;
  padding: 10px 5px;
  word-break: normal;
}

.tg th {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: normal;
  overflow: hidden;
  padding: 10px 5px;
  word-break: normal;
}

.tg .tg-0lax {
  text-align: left;
  vertical-align: top
}
</style>
