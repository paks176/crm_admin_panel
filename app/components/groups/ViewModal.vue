<script setup lang="ts">
import type {ApolloError, Role, Group, User} from "~/types";
import GROUP from '~/graphql/queries/Group.graphql'
import { format } from "date-fns";
import LoadingCover from "~/components/ui/LoadingCover.vue";
import { useApolloClient } from '#imports'

const toast = useToast()

const $props = defineProps<{
  groupId: string,
}>()

const $emits = defineEmits(['refreshGroupsList', 'editList'])

const opened = ref(false)

const formRef = useTemplateRef('userFormRef')

const localCopyGroup = reactive<Group>({
  _id: '',
  id: '',
  children: [],
  name: '',
  parent_id: null,
  parent: null,
  supervisors: [],
  isExpandedAccess: false,
  members: []
})

const groupInfo = reactive({
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
    entityId: $props.groupId,
    source: 'groups',
    target,
    oldList
  })
}

const { client } = useApolloClient()

const switchEdit = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    groupInfo[property][index].edit = !groupInfo[property][index].edit
  } else groupInfo[property].edit = !groupInfo[property].edit
}

const addFieldAndFocus = (property: string): void => {
  if (property) {
    groupInfo[property].forEach((property) => {
      property.edit = false
    })
    groupInfo[property].push({
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
    const targetItem = groupInfo[property][index]
    if (targetItem) {
      if (!targetItem.oldValue && index > 0) {
        groupInfo[property].splice(index, 1)
      } else {
        targetItem.value = targetItem.oldValue
      }
    }
  } else {
    groupInfo[property].value = groupInfo[property].oldValue
  }
}

const clearField = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    if (index === 0) {
      groupInfo[property][0].value = ''
    } else groupInfo[property].splice(index, 1)
  } else {
    groupInfo[property].value = ''
  }
}

const checkIfAllUnfocused = (property: string) => {
  return !groupInfo[property].some((item) => item.edit);
}

const checkLengthAndValuesDifference = (): boolean => {
  const fields = ['phones', 'addresses', 'emails']

  for (const arrayField of fields) {
    const currentField = groupInfo[arrayField]
    const propField = localCopyGroup.info[arrayField]

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
    if (groupInfo[arrayField].length > 1) {
      result = true
      return
    }

    if (groupInfo[arrayField].some((field) => field.value)) {
      result = true
    }
  })

  if (!result) {
    result = !!(groupInfo.post.value || groupInfo.fullname.value)
  }

  return result
}

const checkChanges = () => {
  if ($props.groupId) {
    if (localCopyGroup.info) {
      if (localCopyGroup.info?.fullname || localCopyGroup.info?.post) {
        if (localCopyGroup.info?.fullname && (groupInfo.fullname.value !== localCopyGroup.info.fullname)) {
          hasChanges.value = true
          return
        }
        if (localCopyGroup.info?.post && (groupInfo.post.value !== localCopyGroup.info.post)) {
          hasChanges.value = true
          return
        }
        hasChanges.value = checkLengthAndValuesDifference()
      }
    } else hasChanges.value = checkAnyLocalChanges()
  }
}

const getGroup = async (groupId: string): Promise<void> => {
  try {
    const { data } = await client.query({
      query: GROUP,
      variables: {
        groupId: groupId
      },
      fetchPolicy: 'no-cache'
    })

    if (data?.Group) {
      applyGroupData(data.Group)
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

const resetGroupData = () => {
  localCopyGroup.id = ''
  localCopyGroup.children = []
  localCopyGroup.name = ''
  localCopyGroup.parent_id = null
  localCopyGroup.parent = null
  localCopyGroup.supervisors = []
  localCopyGroup.isExpandedAccess = false
}

const applyGroupData = (groupData: Group): void => {
  localCopyGroup.id = groupData._id
  localCopyGroup.children = groupData.children
  localCopyGroup.name = groupData.name
  localCopyGroup.parent_id = groupData.parent_id
  localCopyGroup.parent = groupData.parent
  localCopyGroup.supervisors = groupData.supervisors
  localCopyGroup.isExpandedAccess = groupData.isExpandedAccess
  localCopyGroup.members = groupData.members
}

const unwatchChanges = watch(groupInfo, () => {
  checkChanges()
}, { deep: true })

const groupCardKey = ref(0)

watch(() => $props.groupId, async () => {
  if ($props.groupId) {
    isLoading.value = true
    hasChanges.value = false
    opened.value = true
    await getGroup($props.groupId)
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
      resetGroupData()
    }, 1000)
  }
})
</script>

<template>
  <UModal v-model:open="opened" title="Группа">
    <template #body>
      <UCard class="relative" variant="soft">
        <LoadingCover :show="isLoading" />
        <div class="user-card" ref="userFormRef" :key="groupCardKey">
          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">ID:</p>
            <p class="font-semibold">{{ localCopyGroup?.id }}</p>
          </div>

          <hr>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Название:</p>
            <p class="font-semibold">{{ localCopyGroup?.name }}</p>
          </div>

          <hr>

          <div v-if="localCopyGroup.parent" class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Родитель:</p>
            <p class="font-semibold">{{ localCopyGroup.parent }}</p>
          </div>

          <hr v-if="localCopyGroup.parent">

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Руководители:</p>
            <div
              v-if="localCopyGroup?.supervisors.length"
              class="flex flex-wrap gap-2"
            >
              <UBadge
                v-for="user in localCopyGroup.supervisors"
                :label="user.name"
                variant="soft"
              />
            </div>
            <UButton
              disabled
              icon="uil-pen"
            />
          </div>

          <hr v-if="localCopyGroup?.supervisors.length">

          <div v-if="localCopyGroup.members.length" class="user-card__item my-5">
            <p class="w-1/4 mb-3">Участники:</p>
            <div class="flex wrap gap-2">
              <UBadge
                v-for="user in localCopyGroup.members.slice(0, 3)"
                :label="user.name"
                variant="soft"
              />
            </div>

            <details class="my-3" v-if="localCopyGroup.members.length > 3">
              <summary class="mb-3">
                <span class="font-semibold cursor-pointer">Еще</span>
              </summary>
              <div class="flex wrap gap-2">
                <UBadge
                  v-for="user in localCopyGroup.members.slice(3)"
                  :label="user.name"
                  variant="soft"
                />
              </div>
            </details>
          </div>

          <UButton
            class="mb-3"
            @click="showEditListDialog('users', localCopyGroup.members)"
          >
            Добавить/убрать участников
          </UButton>

          <hr v-if="localCopyGroup.members.length">

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
</style>
