<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { User, ApolloError, QueryResponse, Role, GroupShort, ListEditData } from '~/types'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import { format } from 'date-fns'
import ListEditor from "~/components/modal/ListEditor.vue";

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const table = useTemplateRef('table')
const requestError = ref('')
const userToShow: Ref<string> = ref('')
const showListEditorModal = ref(false)

useHead({
  title: 'Пользователи'
})

const columnFilters = ref([{
  id: 'name',
  value: ''
}])

const columnVisibility = ref()
const rowSelection = ref({})

const response: QueryResponse<'allUsers', []> = await useAsyncQuery(ALL_USERS)

let allUsers: Ref<User[] | []> = computed(() => response?.data?.value?.allUsers || [])

const refreshHandler = async () => {
  try {
    requestError.value = ''
    await response.refresh()

    toast.add({
      title: 'Список пользователей обновлен',
      duration: 5000,
      color: 'success'
    })
  } catch (error: unknown) {
    const localError = error as ApolloError
    requestError.value = localError.message

    toast.add({
      title: 'Ошибка обновления пользователей',
      description: requestError.value,
      duration: 5000,
      color: 'error'
    })
  }
}

const columns: Ref<TableColumn<User>[]> = ref([
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Имя',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      return h('span', {
        class: 'cursor-pointer underline hover:text-primary',
        onClick: () => userToShow.value = row.original.id
      }, row.getValue('name'))
    }
  },
  {
    accessorKey: 'roles',
    header: 'Роли',
    cell: ({ row }) => {
      const roles: Role[] = row.getValue('roles')
      if (roles.length) {
        const badges = roles.map((role) => {
          const color = role.name === 'Администратор' ? 'info' : 'primary'
          return h(UBadge, { variant: 'soft', color: color, label: role.name })
        })
        return h('div', { class: 'flex flex-wrap gap-2' }, badges)
      }
    }
  },
  {
    accessorKey: 'groups',
    header: 'Группы',
    cell: ({ row }) => {
      const groups: GroupShort[] = row.getValue('groups')
      if (groups.length) {
        const badges = groups.map((group) => {
          const color = group.name === 'Администратор' ? 'secondary' : 'success'
          return h(UBadge, { variant: 'solid', color: color, label: group.name })
        })
        return h('div', { class: 'flex flex-wrap gap-2' }, badges)
      }
    }
  },
  {
    accessorKey: 'created_date',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Дата создания',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => format(new Date(row.getValue('created_date')), 'HH:mm / dd.MM.yyyy')
  },
  {
    accessorKey: 'updated_date',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Дата обновления',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => format(new Date(row.getValue('updated_date')), 'HH:mm / dd.MM.yyyy')
  },
  {
    accessorKey: 'banned',
    header: 'Заблокирован',
    cell: ({ row }) => {
      if (row.getValue('banned')) {
        return 'Да'
      } else return 'Нет'
    }
  },
  {
    accessorKey: 'email',
    header: 'Email (логин)',
  }
])

const name = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('name')?.setFilterValue(value || undefined)
  }
})

const listEditData: ListEditData = {
  entityId: '',
  oldList: [],
  target: '',
  source: ''
}

const launchListEditing = (dataToEdit: ListEditData): void => {
  const { entityId, target, source } = dataToEdit
  if (entityId && target && source) {
    listEditData.entityId = entityId
    listEditData.oldList = dataToEdit.oldList || []
    listEditData.target = dataToEdit.target
    listEditData.source = dataToEdit.source

    showListEditorModal.value = true
  }
}

const closeListEditModal = (entityId: string): void => {
  userToShow.value = entityId
  showListEditorModal.value = false
}

onMounted(async () => {
  if (requestError.value) {
    toast.add({
      title: 'Ошибка получения пользователей',
      description: requestError.value,
      duration: 5000,
      close: true
    })
  }
})
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Пользователи">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UsersViewModal
            :userId="userToShow"
            @after:leave="userToShow = ''"
            @refresh-users-list="refreshHandler()"
            @edit-list="launchListEditing"
          />

          <UsersAddModal @refresh-users-list="refreshHandler()" />

          <ListEditor
            :list-edit-data="listEditData"
            :show-modal="showListEditorModal"
            @close="closeListEditModal"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="name"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Найти по имени"
        />
          <div class="flex flex-wrap items-center gap-1.5">
            <UsersEditGroupsModal :users="table?.tableApi?.getFilteredSelectedRowModel().rows || []">
              <UButton
                v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                label="Добавить/убрать группы"
                color="primary"
                variant="subtle"
                icon="i-lucide-users"
              >
                <template #trailing>
                  <UKbd>
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                  </UKbd>
                </template>
              </UButton>
            </UsersEditGroupsModal>

            <UsersEditRolesModal :users="table?.tableApi?.getFilteredSelectedRowModel().rows || []">
              <UButton
                v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                label="Добавить/убрать роли"
                color="info"
                variant="subtle"
                icon="i-oui-app-users-roles"
              >
                <template #trailing>
                  <UKbd>
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                  </UKbd>
                </template>
              </UButton>
            </UsersEditRolesModal>

            <UsersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
              <UButton
                v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                label="Удалить"
                color="error"
                variant="subtle"
                icon="i-lucide-trash"
              >
                <template #trailing>
                  <UKbd>
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                  </UKbd>
                </template>
              </UButton>
            </UsersDeleteModal>

            <UDropdownMenu
              :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => (column.getCanHide() && typeof(column.columnDef.header) === 'string'))
                .map((column: any) => ({
                  label: column.columnDef.header,
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
              :content="{ align: 'end' }"
            >
              <UButton
                label="Настроить столбцы"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-settings-2"
              />
            </UDropdownMenu>
          </div>
        </div>

        <UTable
          ref="table"
          :key="allUsers.length"
          v-model:column-filters="columnFilters"
          v-model:column-visibility="columnVisibility"
          v-model:row-selection="rowSelection"
          class="shrink-0"
          :data="allUsers"
          :columns="columns"
          sticky
          :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
        />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length" class="text-sm text-muted">
            {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} из
            {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} строк выбрано.
          </div>
        </div>
    </template>
  </UDashboardPanel>
</template>
