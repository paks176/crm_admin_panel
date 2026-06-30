<script setup lang="ts">
import type {User} from "~/types";
import {format} from "date-fns";
import {property} from "zod";

const $props = defineProps<{
  user: User | null,
}>()

const opened = ref(false)

const formRef = useTemplateRef('userFormRef')

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
  let result = false;
  ['phones', 'addresses', 'emails'].forEach((arrayField) => {
    if (
      userInfo[arrayField].length === 1 &&
      $props.user.info[arrayField].length === 0 &&
      userInfo[arrayField][0].value === ''
    ) {
      result = false
    } else {
      userInfo[arrayField].forEach((item, index) => {
        if (!$props.user.info[arrayField][index]) {
          result = !!item.value
        } else result = item.value !== $props.user.info[arrayField][index]
      })
    }
  })
  return result
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
    return userInfo[property].filter((item) => item.value)
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
    return userInfo[property].filter((item) => item.value)
  } else return []
}

const updateUserInfo = () => {
  let requestObject = {}

  if ($props.user.info) {
    requestObject.user_id = userInfo.user_id

    const standardInfo = $props.user.info

    const changedEmails = returnChangedFields('emails')
    const changedAddresses = returnChangedFields('addresses')
    const changedPhones = returnChangedFields('phones')

    requestObject = {
      user_id: userInfo.user_id,
      ...(userInfo.fullname.value !== standardInfo.fullname && { fullname: userInfo.fullname.value }),
      ...(userInfo.post.value !== standardInfo.post && { post: userInfo.post.value }),
      ...(changedEmails.length && { emails: changedEmails }),
      ...(changedAddresses.length && { addresses: changedAddresses }),
      ...(changedPhones.length && { phones: changedPhones }),
    }
  } else {
    const newEmails = getFieldValues('emails')
    const newAddresses = getFieldValues('addresses')
    const newPhones = getFieldValues('phones')

    requestObject = {
      user_id: userInfo.user_id,
      ...(userInfo.fullname.value && { fullname: userInfo.fullname.value }),
      ...(userInfo.post.value && { post: userInfo.post.value }),
      ...(newEmails.length && { emails: newEmails }),
      ...(newAddresses.length && { addresses: newAddresses }),
      ...(newPhones.length && { phones: newPhones }),
    }
  }
}

watch(userInfo, () => {
  checkChanges()
}, { deep: true })

watch(() => $props.user, () => {
  if ($props.user && $props.user.id) {
    opened.value = true
    userInfo.user_id = $props.user.id
    if ($props.user?.info) {
      const outerUserInfo = $props.user.info
      const arrays = ['emails', 'addresses', 'phones']
      for (const key in outerUserInfo) {
        if (userInfo[key]) {
          if (arrays.includes(key)) {
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
            if (outerUserInfo[key]) {
              userInfo[key].value = outerUserInfo[key]
              userInfo[key].oldValue = outerUserInfo[key]
            }
          }
        }
      }
    }
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
                <UInput
                  v-if="userInfo.fullname.edit"
                  v-model="userInfo.fullname.value"
                  @blur="switchEdit('fullname')"
                  @keyup.enter="switchEdit('fullname')"
                  @keyup.esc.self="switchEdit('fullname')"
                  variant="outline"
                />
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
                  <UInput
                    v-if="emailField.edit"
                    v-model="emailField.value"
                    @blur="switchEdit('emails', index)"
                    @keyup.enter="switchEdit('emails', index)"
                    @keyup.esc="switchEdit('emails', index)"
                    variant="outline"
                    name="input-emails"
                  />
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
                  <UInput
                    v-if="phoneField.edit"
                    v-model="phoneField.value"
                    @blur="switchEdit('phones', index)"
                    @keyup.enter="switchEdit('phones', index)"
                    @keyup.esc="switchEdit('phones', index)"
                    variant="outline"
                    name="input-phones"
                  />
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
                  <UInput
                    v-if="addressField.edit"
                    v-model="addressField.value"
                    @blur="switchEdit('addresses', index)"
                    @keyup.enter="switchEdit('addresses', index)"
                    @keyup.esc="switchEdit('addresses', index)"
                    variant="outline"
                    name="input-addresses"
                  />
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

          <UButton :disabled="!hasChanges">Применить изменения</UButton>
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
