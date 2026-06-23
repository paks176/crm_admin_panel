<script setup lang="ts">
import type { User } from "~/types";
import {format} from "date-fns";

const $props = defineProps<{
  user: User | null,
}>()

const opened = ref(false)

const edit = (property: string): void => console.log(property)

watch(() => $props.user, () => {
  if ($props.user && $props.user.id) {
    opened.value = true
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
            <h3 class="editable" @click="edit('name')">
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
              <div class="flex wrap gap-2">
                <UBadge
                  v-for="role in user?.roles"
                  :label="role.name"
                  class="pr-0 py-0 gap-2 overflow-hidden"
                  variant="soft"
                  :color="role.name === 'Администратор' ? 'info' : 'primary'"
                >
                  <template #trailing>
                    <UButton icon="boxicons-trash-filled" class="cursor-pointer rounded-none" variant="soft"/>
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
              <div class="flex wrap gap-2">
                <UBadge
                  v-for="group in user?.groups"
                  :label="group.name"
                  class="pr-0 py-0 gap-2 overflow-hidden"
                  variant="solid"
                  :color="group.name === 'Администратор' ? 'secondary' : 'success'"
                >
                  <template #trailing>
                    <UButton icon="boxicons-trash-filled" class="cursor-pointer rounded-none" variant="soft"/>
                  </template>
                </UBadge>
                <UButton icon="ic-outline-plus" class="cursor-pointer" />
              </div>
            </template>
            <template v-else>
              Нет групп
            </template>
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

.editable {
  &::after {
    content: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 4.1917C16.0006 4.08642 15.9804 3.98206 15.9406 3.8846C15.9008 3.78714 15.8421 3.69849 15.768 3.62374L12.376 0.231996C12.3012 0.157856 12.2126 0.0992007 12.1151 0.0593919C12.0176 0.0195832 11.9133 -0.000595299 11.808 1.33704e-05C11.7027 -0.000595299 11.5983 0.0195832 11.5009 0.0593919C11.4034 0.0992007 11.3147 0.157856 11.24 0.231996L8.976 2.49583L0.232013 11.2392C0.157868 11.3139 0.0992079 11.4026 0.0593963 11.5C0.0195847 11.5975 -0.000595342 11.7019 1.33714e-05 11.8071V15.1989C1.33714e-05 15.411 0.0842987 15.6145 0.234328 15.7645C0.384356 15.9145 0.587839 15.9988 0.800012 15.9988H4.19201C4.30395 16.0049 4.41592 15.9874 4.52066 15.9474C4.6254 15.9075 4.72057 15.8459 4.80001 15.7668L13.496 7.02349L15.768 4.79966C15.8409 4.72203 15.9004 4.63282 15.944 4.53567C15.9517 4.47191 15.9517 4.40745 15.944 4.34369C15.9477 4.30645 15.9477 4.26893 15.944 4.2317L16 4.1917ZM3.86401 14.3989H1.60001V12.1351L9.544 4.1917L11.808 6.45553L3.86401 14.3989ZM12.936 5.32762L10.672 3.06378L11.808 1.93587L14.064 4.1917L12.936 5.32762Z' fill='%238E8E93' /%3E%3C/svg%3E");
    margin-left: 8px;
    width: 16px;
    height: 16px;
    opacity: 0;
    cursor: pointer;
    transition: opacity .3s ease;
  }
  &:hover::after {
    opacity: 1;
  }
}

</style>
