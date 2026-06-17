<script setup lang="ts">
// import {email} from "zod"; ToDo: разобраться в валидации Zod
import createUserService from "~/graphql/services/createUserService.js"
import type {ApolloError, MutationResponse} from "~/types";

const emits = defineEmits(['refreshUsersList'])

const open = ref(false)

const state = reactive({
  name: '',
  email: '',
  password: ''
})

const isFormFilled = computed(() => {
  return state.email.length >= 2 && state.email.length >= 3 && state.password.length >= 4
})

const toast = useToast()

const isUserCreated = ref(false)

const isLoading = ref(false)

const copyUserData = () => {
  const message = `Имя: ${ state.name }\nEmail (логин): ${ state.email }\nПароль: ${ state.password }`
  navigator.clipboard.writeText(message)
  toast.add({
    title: 'Данные пользователя скопированы',
    icon: 'i-lucide-check',
    color: 'info'
  })
}

const createUser = async () => {
  isLoading.value = true
  try {
    await createUserService({
      name: state.name,
      email: state.email,
      password: state.password
    })
    isLoading.value = false
    isUserCreated.value = true

  } catch (error: unknown) {
    const localError = error as ApolloError
    console.error(localError.message)
    toast.add({
      title: 'Ошибка',
      description: localError.message,
      icon: 'i-lucide-check',
      color: 'error'
    })
  }
}

watch(() => open.value, () => {
  if (!open.value) {
    state.name = ''
    state.email = ''
    state.password = ''
    if (isUserCreated.value) {
      emits('refreshUsersList')
    }
  }
})
</script>

<template>
  <UModal v-model:open="open" title="Новый пользователь">
    <UButton label="Добавить пользователя" icon="i-lucide-plus" />

    <template #body>
      <UForm
        v-if="!isUserCreated"
        :state="state"
        class="space-y-4 relative"
      >

        <UFormField label="Имя" name="name">
          <UInput
            v-model="state.name"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <UFormField label="Пароль" name="password">
          <UInput
            v-model="state.password"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <div v-if="isLoading" class="animate-spin absolute inset-[calc(50%-24px)]">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_2018_110)">
              <path d="M24 2C11.5687 1.99952 1.99987 11.9 2 24C2.00013 35.22 10.8932 46 24 46C36.1933 46 46 36.1 46 24" stroke="#114FD3" stroke-width="4" stroke-linecap="round" />
            </g>
            <defs>
              <clipPath id="clip0_2018_110">
                <rect width="48" height="48" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </UForm>

      <UCard
        v-if="isUserCreated"
        title="Созданный пользователь"
        variant="soft"
        class="relative"
      >
        <div>
          <p>
            <span>Имя:</span>&nbsp;<span class="font-semibold">{{ state.name }}</span>
          </p>
          <br>
          <p>
            <span>Email (логин):</span>&nbsp;<span class="font-semibold">{{ state.email }}</span>
          </p>
          <br>
          <p>
            <span>Пароль:</span>&nbsp;<span class="font-semibold">{{ state.password }}</span>
          </p>
        </div>
      </UCard>

      <div class="flex justify-end gap-2 mt-6">
        <template v-if="!isUserCreated">
          <UButton
            label="Отмена"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            :disabled="isLoading || !isFormFilled"
            label="Создать"
            color="primary"
            variant="solid"
            type="submit"
            @click="createUser"
          />
        </template>

        <UButton
          v-if="isUserCreated"
          label="Скопировать данные"
          color="info"
          variant="solid"
          type="submit"
          icon="solar-copy-bold"
          @click="copyUserData"
        />
      </div>
    </template>
  </UModal>
</template>
