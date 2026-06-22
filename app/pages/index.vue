<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type {User, ApolloError, QueryResponse, Role, GroupShort} from '~/types'
import ALL_USERS from '~/graphql/queries/AllUsers.graphql'
import { upperFirst } from 'scule'
import { format } from 'date-fns'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')

const toast = useToast()
const table = useTemplateRef('table')
const requestError = ref('')

useHead({
  title: 'Пользователи'
})

const columnFilters = ref([{
  id: 'email',
  value: ''
}])

const columnVisibility = ref()
const rowSelection = ref({ 1: true })

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

function getRowItems(row: Row<User>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'Customer ID copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View customer details',
      icon: 'i-lucide-list'
    },
    {
      label: 'View customer payments',
      icon: 'i-lucide-wallet'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Customer deleted',
          description: 'The customer has been deleted.'
        })
      }
    }
  ]
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
    header: 'Имя',
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
    header: 'Дата создания',
    cell: ({ row }) => format(new Date(row.getValue('created_date')), 'HH:mm dd.MM.yyyy')
  },
  {
    accessorKey: 'updated_date',
    header: 'Дата обновления',
    cell: ({ row }) => format(new Date(row.getValue('updated_date')), 'HH:mm dd.MM.yyyy')
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
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Почта (логин)',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
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
          <CustomersAddModal @refresh-users-list="refreshHandler()" />
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
            <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
              <UButton
                v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                label="Удалить пользователей"
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
            </CustomersDeleteModal>

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
          <div class="text-sm text-muted">
            {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
            {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
          </div>
        </div>
    </template>
  </UDashboardPanel>
</template>
