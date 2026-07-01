<script setup lang="ts">
import type {ApolloError, User} from "~/types";
import { format } from "date-fns";
import updateUserInfoService from "~/graphql/services/updateUserInfoService.js";

const toast = useToast()

const $props = defineProps<{
  user: User | null,
}>()

const opened = ref(false)

const formRef = useTemplateRef('userFormRef')

let id = ''

const userInfo = reactive({
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

const switchEdit = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    userInfo[property][index].edit = !userInfo[property][index].edit
  } else userInfo[property].edit = !userInfo[property].edit
}

const addFieldAndFocus = (property: string): void => {
  if (property) {
    userInfo[property].forEach((property) => {
      property.edit = false
    })
    userInfo[property].push({
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
    const targetItem = userInfo[property][index]
    if (targetItem) {
      if (!targetItem.oldValue && index > 0) {
        userInfo[property].splice(index, 1)
      } else {
        targetItem.value = targetItem.oldValue
      }
    }
  } else {
    userInfo[property].value = userInfo[property].oldValue
  }
}

const clearField = (property: string, index?: number | undefined): void => {
  if (index !== undefined) {
    if (index === 0) {
      userInfo[property][0].value = ''
    } else userInfo[property].splice(index, 1)
  } else {
    userInfo[property].value = ''
  }
}

const checkIfAllUnfocused = (property: string) => {
  return !userInfo[property].some((item) => item.edit);
}

// ToDo Добавить дату рождения

const checkLengthAndValuesDifference = (): boolean => {
  const fields = ['phones', 'addresses', 'emails']

  for (const arrayField of fields) {
    const currentField = userInfo[arrayField]
    const propField = $props.user.info[arrayField]

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
    if (userInfo[arrayField].length > 1) {
      result = true
      return
    }

    if (userInfo[arrayField].some((field) => field.value)) {
      result = true
    }
  })

  if (!result) {
    result = !!(userInfo.post.value || userInfo.fullname.value)
  }

  return result
}

const checkChanges = () => {
  // ToDo отслеживание изменений по аватару, логину
  if ($props.user) {
    if ($props.user.info) {
      if ($props.user.info?.fullname || $props.user.info?.post) {
        if ($props.user.info?.fullname && (userInfo.fullname.value !== $props.user.info.fullname)) {
          hasChanges.value = true
          return
        }
        if ($props.user.info?.post && (userInfo.post.value !== $props.user.info.post)) {
          hasChanges.value = true
          return
        }
        hasChanges.value = checkLengthAndValuesDifference()
      }
    } else hasChanges.value = checkAnyLocalChanges()
  }
}

const getFieldValues = (property: string): String[] | [] => {
  if (userInfo[property].length) {
    return userInfo[property].filter((item) => item.value).map((item) => item.value)
  } else return []
}

const returnChangedFields = (property: string): String[] | [] => {
  if ($props.user?.info[property].length) {
    const stringArrayLocalValues = getFieldValues(property)
    if (stringArrayLocalValues.length !== $props.user.info[property].length) {
      return stringArrayLocalValues
    } else if (stringArrayLocalValues.some((item, index) => item !== $props.user.info[property][index])) {
      return stringArrayLocalValues
    } else return []
  } else if (userInfo[property].length) {
    return userInfo[property].filter((item) => item.value).map((item) => item.value)
  } else return []
}

const updateUserInfoRequest = async () => {
  let requestObject = {}

  if ($props.user.info) {
    // редактирование существующего userInfo
    requestObject.user_id = userInfo.user_id

    const standardInfo = $props.user.info

    const changedEmails = returnChangedFields('emails')
    const changedAddresses = returnChangedFields('addresses')
    const changedPhones = returnChangedFields('phones')

    requestObject = {
      user_id: userInfo.user_id,
      birthday_date: 0,
      fullname: userInfo.fullname.value,
      emails: changedEmails,
      phones: changedPhones,
      addresses: changedAddresses,
      ...(userInfo.post.value !== standardInfo.post && { post: userInfo.post.value }),
    }
  } else {
    // создание нового userInfo
    const newEmails = getFieldValues('emails')
    const newAddresses = getFieldValues('addresses')
    const newPhones = getFieldValues('phones')

    requestObject = {
      user_id: userInfo.user_id,
      birthday_date: 0,
      ...(userInfo.fullname.value && { fullname: userInfo.fullname.value }),
      ...(userInfo.post.value && { post: userInfo.post.value }),
      ...(newEmails.length && { emails: newEmails }),
      ...(newAddresses.length && { addresses: newAddresses }),
      ...(newPhones.length && { phones: newPhones }),
    }
  }

  if (Object.keys(requestObject).length > 1) {
    isLoading.value = true
    console.log(requestObject)
    try {
      await updateUserInfoService(id, requestObject)
      isLoading.value = false
      toast.add({
        title: 'Успешно',
        description: 'Данные пользователя обновлены',
        icon: 'i-lucide-check',
        color: 'success'
      })
    } catch (error: unknown) {
      const localError = error as ApolloError
      console.error(localError.message)
      isLoading.value = false
      toast.add({
        title: 'Ошибка',
        description: localError.message,
        icon: 'i-lucide-check',
        color: 'error'
      })
    }
  }
}

watch(userInfo, () => {
  checkChanges()
}, { deep: true })

watch(() => $props.user, () => {
  console.log($props.user)
  if ($props.user && $props.user.id) {
    opened.value = true
    userInfo.user_id = $props.user.id

    if ($props.user?.info) {
      id = $props.user.info.id
      const outerUserInfo = $props.user.info
      userInfo.user_id = outerUserInfo.user_id
      const arrays = ['emails', 'addresses', 'phones']
      for (const key in outerUserInfo) {
        if (userInfo[key]) {
          if (arrays.includes(key)) {
            // для значений массивами
            if (outerUserInfo[key].length) {
              userInfo[key] = outerUserInfo[key].map((item) => {
                return {
                  edit: false,
                  value: item,
                  oldValue: item
                }
              })
            }
          } else {
            // для значений строками/числами
            if (outerUserInfo[key] && key !== 'id' && key !== 'user_id') {
              userInfo[key].value = outerUserInfo[key]
              userInfo[key].oldValue = outerUserInfo[key]
            }
          }
        }
      }
    } else {
      id = $props.user.id
    }

    console.log(userInfo)
  }
})

watch(opened, () => {
  if (!opened.value) {
    nextTick(() => {
      userInfo.fullname = {
        value: '',
        oldValue: '',
        edit: false
      }

      userInfo.post = {
        value: '',
        oldValue: '',
        edit: false
      }

      userInfo.user_id = ''

      userInfo.emails = [
        {
          value: '',
          oldValue: '',
          edit: false
        }
      ]

      userInfo.phones = [
        {
          value: '',
          oldValue: '',
          edit: false
        }
      ]

      userInfo.addresses = [
        {
          value: '',
          oldValue: '',
          edit: false
        }
      ]

      hasChanges.value = false
    })
  }
})
</script>

<template>
  <UModal v-model:open="opened" :title="user?.name">
    <template #body>
      <UCard variant="soft">
        <div class="user-card" ref="userFormRef">
          <div class="user-card__top mb-8 flex items-center gap-4">
            <div class="user-card__avatar relative overflow-hidden rounded-[50%] cursor-pointer">
              <img :src="user?.avatar ? user.avatar.file_id : '/images/default_avatar.jpg'" alt="Аватар">
              <div
                class="user-card__edit__avatar transition-opacity absolute flex items-center justify-center w-full h-full top-0">
                <UIcon name="uil-pen" class="size-8"/>
              </div>
            </div>
            <h3>
              {{ user?.name }}
            </h3>
          </div>
          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Email (Login):</p>
            <p class="font-semibold">{{ user?.email }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Дата создания:</p>
            <p class="font-semibold">{{ format(new Date(user?.created_date), 'dd.MM.yyyy / HH:mm') }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Дата изменения:</p>
            <p class="font-semibold">{{ format(new Date(user?.updated_date), 'dd.MM.yyyy / HH:mm') }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Роли:</p>
            <template v-if="user?.roles.length">
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="role in user?.roles"
                  :label="role.name"
                  class="pr-0 py-0 gap-2 overflow-hidden"
                  variant="soft"
                  :color="role.name === 'Администратор' ? 'info' : 'primary'"
                >
                  <template #trailing>
                    <UButton
                      icon="boxicons-trash-filled"
                      class="rounded-none"
                      variant="soft"
                    />
                  </template>
                </UBadge>
                <UButton icon="ic-outline-plus"/>
              </div>
            </template>
            <template v-else>
              Нет ролей
            </template>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p class="w-1/4">Группы:</p>
            <template v-if="user?.roles.length">
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="group in user?.groups"
                  :label="group.name"
                  class="pr-0 py-0 gap-2 overflow-hidden"
                  variant="solid"
                  :color="group.name === 'Администратор' ? 'secondary' : 'success'"
                >
                  <template #trailing>
                    <UButton
                      icon="boxicons-trash-filled"
                      class="rounded-none"
                      variant="soft"
                    />
                  </template>
                </UBadge>
                <UButton icon="ic-outline-plus"/>
              </div>
            </template>
            <template v-else>
              Нет групп
            </template>
          </div>

          <hr class="my-5 main-divider">

          <div class="my-5">
            <h3 class="mb-5 font-semibold">Пользовательская информация</h3>
            <div class="user-card__item flex gap-4 my-5">
              <p class="w-1/4">Полное имя:</p>
              <div>
                <template v-if="userInfo.fullname.edit">
                  <UInput
                    v-if="userInfo.fullname.edit"
                    v-model="userInfo.fullname.value"
                    @blur="switchEdit('fullname')"
                    @keyup.enter="switchEdit('fullname')"
                    @keyup.esc.self="switchEdit('fullname')"
                    variant="outline"
                  />

                  <UButton
                    v-if="userInfo.fullname.value"
                    trailing-icon="zondicons-checkmark"
                    size="sm"
                    title="Сохранить"
                    variant="soft"
                    @click="switchEdit('fullname')"
                  />
                  <UButton
                    v-else
                    trailing-icon="mdi-cancel-bold"
                    size="sm"
                    title="Выйти из редактирования"
                    variant="soft"
                    @click="switchEdit('fullname')"
                  />
                </template>

                <div class="user-card__item__field flex gap-2" v-else>
                  <p :class="userInfo.fullname.value ? 'font-semibold' : 'italic text-gray'">
                    {{ userInfo.fullname.value || 'Не заполнено' }}
                  </p>
                  <UButton
                    trailing-icon="uil-pen"
                    size="sm"
                    title="Редактировать"
                    variant="soft"
                    @click="switchEdit('fullname')"
                  />
                  <UButton
                    v-if="userInfo.fullname.value"
                    trailing-icon="mdi-cancel-bold"
                    size="sm"
                    title="Удалить значение"
                    variant="soft"
                    @click="clearField('fullname')"
                  />
                  <UButton
                    v-if="userInfo.fullname.value !== userInfo.fullname.oldValue"
                    trailing-icon="nrk-back"
                    size="sm"
                    title="Отменить изменение"
                    variant="soft"
                    @click="userInfo.fullname.value = userInfo.fullname.oldValue"
                  />
                </div>
              </div>
            </div>
            <hr>
            <div class="user-card__item flex gap-4 my-5">
              <p class="w-1/4">Электронные почты:</p>
              <div class="flex flex-col gap-2">
                <div v-for="(emailField, index) in userInfo.emails" class="flex gap-2 items-start">
                  <template v-if="emailField.edit">
                    <UInput
                      v-model="emailField.value"
                      @blur="switchEdit('emails', index)"
                      @keyup.enter="switchEdit('emails', index)"
                      @keyup.esc="switchEdit('emails', index)"
                      variant="outline"
                      name="input-emails"
                    />

                    <UButton
                      v-if="emailField.value"
                      trailing-icon="zondicons-checkmark"
                      size="sm"
                      title="Сохранить"
                      variant="soft"
                      @click="switchEdit('emails', index)"
                    />
                    <UButton
                      v-else
                      trailing-icon="mdi-cancel-bold"
                      size="sm"
                      title="Выйти из редактирования"
                      variant="soft"
                      @click="switchEdit('emails', index)"
                    />
                  </template>
                  <template v-else>
                    <p :class="emailField.value ? 'font-semibold' : 'italic text-gray'">
                      {{ emailField.value || 'Не заполнено' }}
                    </p>
                    <div class="flex gap-2">
                      <UButton
                        trailing-icon="uil-pen"
                        size="sm"
                        title="Редактировать"
                        variant="soft"
                        @click="switchEdit('emails', index)"
                      />
                      <UButton
                        v-if="index > 0 || emailField.value"
                        trailing-icon="mdi-cancel-bold"
                        size="sm"
                        title="Удалить значение"
                        variant="soft"
                        @click="clearField('emails', index)"
                      />
                      <UButton
                        v-if="userInfo.emails[index].oldValue && (userInfo.emails[index].value !== userInfo.emails[index].oldValue)"
                        trailing-icon="nrk-back"
                        size="sm"
                        title="Отменить изменение"
                        variant="soft"
                        @click="cancelChange('emails', index)"
                      />
                    </div>
                  </template>
                </div>
                <UButton
                  class="mt-4 w-min whitespace-nowrap"
                  icon="ic-outline-plus"
                  size="sm"
                  variant="soft"
                  v-if="userInfo.emails[0]?.value && checkIfAllUnfocused('emails')"
                  @click="addFieldAndFocus('emails')"
                >
                  Добавить почту
                </UButton>
              </div>
            </div>
            <hr>
            <div class="user-card__item flex gap-4 my-5">
              <p class="w-1/4">Телефоны:</p>
              <div class="flex flex-col gap-2">
                <div v-for="(phoneField, index) in userInfo.phones" class="flex gap-2 items-start">
                  <template  v-if="phoneField.edit">
                    <UInput
                      v-model="phoneField.value"
                      @blur="switchEdit('phones', index)"
                      @keyup.enter="switchEdit('phones', index)"
                      @keyup.esc="switchEdit('phones', index)"
                      variant="outline"
                      name="input-phones"
                    />
                    <UButton
                      v-if="phoneField.value"
                      trailing-icon="zondicons-checkmark"
                      size="sm"
                      title="Сохранить"
                      variant="soft"
                      @click="switchEdit('phones', index)"
                    />
                    <UButton
                      v-else
                      trailing-icon="mdi-cancel-bold"
                      size="sm"
                      title="Выйти из редактирования"
                      variant="soft"
                      @click="switchEdit('phones', index)"
                    />
                  </template>

                  <template v-else>
                    <p :class="phoneField.value ? 'font-semibold' : 'italic text-gray'">
                      {{ phoneField.value || 'Не заполнено' }}
                    </p>
                    <div class="flex gap-2">
                      <UButton
                        trailing-icon="uil-pen"
                        size="sm"
                        title="Редактировать"
                        variant="soft"
                        @click="switchEdit('phones', index)"
                      />
                      <UButton
                        v-if="phoneField.value"
                        trailing-icon="mdi-cancel-bold"
                        size="sm"
                        title="Удалить значение"
                        variant="soft"
                        @click="clearField('phones', index)"
                      />
                      <UButton
                        v-if="userInfo.phones[index].oldValue && (userInfo.phones[index].value !== userInfo.phones[index].oldValue)"
                        trailing-icon="nrk-back"
                        size="sm"
                        title="Отменить изменение"
                        variant="soft"
                        @click="cancelChange('phones', index)"
                      />
                    </div>
                  </template>
                </div>
                <UButton
                  class="mt-4 w-min whitespace-nowrap"
                  icon="ic-outline-plus"
                  size="sm"
                  variant="soft"
                  v-if="userInfo.phones[0]?.value && checkIfAllUnfocused('phones')"
                  @click="addFieldAndFocus('phones')"
                >
                  Добавить телефон
                </UButton>
              </div>
            </div>
            <hr>
            <div class="user-card__item flex gap-4 my-5">
              <p class="w-1/4">Адреса:</p>
              <div class="flex flex-col gap-2">
                <div v-for="(addressField, index) in userInfo.addresses" class="flex gap-2 items-start">
                  <template v-if="addressField.edit">
                    <UInput
                      v-model="addressField.value"
                      @blur="switchEdit('addresses', index)"
                      @keyup.enter="switchEdit('addresses', index)"
                      @keyup.esc="switchEdit('addresses', index)"
                      variant="outline"
                      name="input-addresses"
                    />
                    <UButton
                      v-if="addressField.value"
                      trailing-icon="zondicons-checkmark"
                      size="sm"
                      title="Сохранить"
                      variant="soft"
                      @click="switchEdit('addresses', index)"
                    />
                    <UButton
                      v-else
                      trailing-icon="mdi-cancel-bold"
                      size="sm"
                      title="Выйти из редактирования"
                      variant="soft"
                      @click="switchEdit('addresses', index)"
                    />
                  </template>

                  <template v-else>
                    <p :class="addressField.value ? 'font-semibold' : 'italic text-gray'">
                      {{ addressField.value || 'Не заполнено' }}
                    </p>
                    <div class="flex gap-2">
                      <UButton
                        trailing-icon="uil-pen"
                        size="sm"
                        title="Редактировать"
                        variant="soft"
                        @click="switchEdit('addresses', index)"
                      />
                      <UButton
                        v-if="addressField.value"
                        trailing-icon="mdi-cancel-bold"
                        size="sm"
                        title="Удалить значение"
                        variant="soft"
                        @click="clearField('addresses', index)"
                      />
                      <UButton
                        v-if="userInfo.addresses[index].oldValue && (userInfo.addresses[index].value !== userInfo.addresses[index].oldValue)"
                        trailing-icon="nrk-back"
                        size="sm"
                        title="Отменить изменение"
                        variant="soft"
                        @click="cancelChange('addresses', index)"
                      />
                    </div>
                  </template>
                </div>
                <UButton
                  class="mt-4 w-min whitespace-nowrap"
                  icon="ic-outline-plus"
                  size="sm"
                  variant="soft"
                  v-if="userInfo.addresses[0]?.value && checkIfAllUnfocused('addresses')"
                  @click="addFieldAndFocus('addresses')"
                >
                  Добавить адрес
                </UButton>
              </div>
            </div>
            <hr>
          </div>

          <UButton
            @click="updateUserInfoRequest"
            :disabled="!hasChanges"
          >
            Применить изменения
          </UButton>
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
