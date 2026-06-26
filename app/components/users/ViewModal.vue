<script setup lang="ts">
import type { User } from "~/types";
import {format} from "date-fns";

const $props = defineProps<{
  user: User | null,
}>()

const opened = ref(false)

const userInfo = reactive({
  fullname: ref({
    value: '',
    edit: false
  }),
  post: ref({
    value: '',
    edit: false
  }),
  emails: ref([
    {
      value: '',
      edit: false
    }
  ]),
  phones: ref([
    {
      value: '',
      edit: false
    }
  ]),
  addresses: ref([
    {
      value: '',
      edit: false
    }
  ]),
  user_id: ref([
    {
      value: '',
      edit: false
    }
  ])
})

const switchEdit = (property: string, index: number): void => {
  if (index) {
    userInfo[property][index] = !userInfo[property][index].edit
  } else userInfo[property].edit = !userInfo[property].edit
}

watch(() => $props.user, () => {
  if ($props.user && $props.user.id) {
    opened.value = true
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
                  value: item
                }
              })
            }
          } else {
            if (outerUserInfo[key]) {
              userInfo[key].value = outerUserInfo[key]
            }
          }
        }
      }
    }
  }
})
</script>

<template>
  <UModal v-model:open="opened" :title="user?.name">
    <template #body>
      <UCard variant="soft">
        <div class="user-card">
          <div class="user-card__top mb-8 flex items-center gap-4">
            <div class="user-card__avatar relative overflow-hidden rounded-[50%] cursor-pointer">
              <img :src="user?.avatar ? user.avatar.file_id : '/images/default_avatar.jpg'" alt="Аватар">
              <div class="user-card__edit__avatar transition-opacity absolute flex items-center justify-center w-full h-full top-0">
                <UIcon name="uil-pen" class="size-8" />
              </div>
            </div>
            <h3>
              {{ user?.name }}
            </h3>
          </div>
          <div class="user-card__item flex gap-4 my-5">
            <p>Email (Login):</p>
            <p class="editable font-semibold">{{ user?.email }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p>Дата создания:</p>
            <p class="font-semibold">{{ format(new Date(user?.created_date), 'HH:mm / dd.MM.yyyy') }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p>Дата изменения:</p>
            <p class="font-semibold">{{ format(new Date(user?.updated_date), 'HH:mm / dd.MM.yyyy') }}</p>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p>Роли:</p>
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
                      class="cursor-pointer rounded-none"
                      variant="soft"
                    />
                  </template>
                </UBadge>
                <UButton icon="ic-outline-plus" class="cursor-pointer" />
              </div>
            </template>
            <template v-else>
              Нет ролей
            </template>
          </div>

          <div class="user-card__item flex gap-4 my-5">
            <p>Группы:</p>
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
                      class="cursor-pointer rounded-none"
                      variant="soft"
                    />
                  </template>
                </UBadge>
                <UButton icon="ic-outline-plus" class="cursor-pointer" />
              </div>
            </template>
            <template v-else>
              Нет групп
            </template>
          </div>

          <hr class="my-5">

          <div class="my-5">
            <h3 class="mb-5 font-semibold">Пользовательская информация</h3>
            <div class="user-card__item my-5">
              <p>Полное имя:</p>
              <div class="editable">
                <UInput
                  v-if="userInfo.fullname.edit"
                  v-model="userInfo.fullname.value"
                  @blur="switchEdit('fullname')"
                  variant="outline"
                />
                <div class="user-card__item__field flex gap-2" v-else>
                  <p class="font-semibold">
                    {{ userInfo.fullname.value ?? 'Не заполнено' }}
                  </p>
                  <UButton
                    class=""
                    trailing-icon="uil-pen"
                    size="sm"
                    @click="switchEdit('fullname')"
                  />
                </div>

              </div>
            </div>

            <div class="user-card__item flex gap-4 my-5">
              <p>Электронные почты:</p>
              <div v-for="(emailField, index) in userInfo.emails.value">
                <p class="font-semibold">{{ emailField.value || 'Не заполнено' }}</p>
                <div>
                  <UButton
                    class=""
                    trailing-icon="uil-pen"
                    size="sm"
                    @click="switchEdit('emails', index)"
                  />
                </div>
              </div>
            </div>
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
