<script setup lang="ts">
import authUser from "~/graphql/services/authService"
import { useToast } from "#imports";
import type { ApolloError } from "~/types";
import type { MutationResponse } from "~/types"

const toast = useToast()

useHead({
  title: 'Вход'
})

const loginData = reactive({
  email: '',
  password: ''
})

const { login } = authCheck()

const loginAction = async () => {
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
  }
}
</script>

<template>
  <h1 class="font-semibold">Авторизация</h1>
  <form @submit.prevent="loginAction">
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
    <UButton variant="solid">
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
}
</style>
