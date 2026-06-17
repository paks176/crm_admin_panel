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
  <h1>Авторизация</h1>
  <form @submit.prevent="loginAction">
    <input
      v-model="loginData.email"
      type="text"
      placeholder="Email"
    >
    <input
      v-model="loginData.password"
      type="password"
      placeholder="Password"
    >
    <button type="submit">Войти</button>
  </form>
</template>

<style scoped>
input {
  display: block;
  border: 1px solid gray;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

button {
  border: 1px solid blue;
  width: min-content;
  padding: 5px;
}
</style>
