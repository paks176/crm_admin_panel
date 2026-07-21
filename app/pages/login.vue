<script setup lang="ts">
import authUser from "~/graphql/services/authService"
import { useToast } from "#imports";
import type { ApolloError } from "~/types";
import type { MutationResponse } from "~/types"
import LoadingCover from "~/components/ui/LoadingCover.vue";

const toast = useToast()

useHead({
  title: 'Вход'
})

const loginData = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)

const { login } = authCheck()

const loginAction = async () => {
  isLoading.value = true
  try {
    const { data } = await authUser({
      email: loginData.email,
      password: loginData.password
    }) as MutationResponse<'authUser', string>

    toast.add({
      title: 'Успешно',
      description: 'Успешный вход',
      icon: 'i-lucide-check',
      color: 'success'
    })

    setTimeout(async () => {
      await login(data.authUser)
    }, 1000)

  } catch (error: unknown) {
    const localError = error as ApolloError
    console.error(localError.message)
    toast.add({
      title: 'Ошибка',
      description: localError.message,
      icon: 'i-lucide-check',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <h1 class="font-semibold">Авторизация</h1>
  <form @submit.prevent="loginAction">
    <LoadingCover :show="isLoading" />
    <UInput
      placeholder="Логин"
      v-model="loginData.email"
      variant="outline"
      color="primary"
    />
    <UInput
      v-model="loginData.password"
      placeholder="Пароль"
      variant="outline"
      color="primary"
      type="password"
    />
    <UButton type="submit" variant="solid">
      Войти
    </UButton>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

:global(.animate-spin) {
  margin-top: -50px;
}
</style>
