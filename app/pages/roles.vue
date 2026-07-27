<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {Role, ApolloError, QueryResponse, ListEditData} from '~/types'
import ALL_ROLES from '~/graphql/queries/AllRoles.graphql'
import ListEditor from "~/components/modal/ListEditor.vue";

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')
const requestError = ref('')
const roleToShow: Ref<string> = ref('')
const showListEditorModal = ref(false)

useHead({
  title: 'Роли'
})

const columnFilters = ref([{
  id: 'name',
  value: ''
}])

const columnVisibility = ref()
const rowSelection = ref({})

const response: QueryResponse<'allRoles', []> = await useAsyncQuery(ALL_ROLES)

let allRoles: Ref<Role[] | []> = computed(() => response?.data?.value?.allRoles || [])

const refreshHandler = async () => {
  try {
    requestError.value = ''
    await response.refresh()

    toast.add({
      title: 'Список ролей обновлен',
      duration: 5000,
      color: 'success'
    })
  } catch (error: unknown) {
    const localError = error as ApolloError
    requestError.value = localError.message

    toast.add({
      title: 'Ошибка обновления ролей',
      description: requestError.value,
      duration: 5000,
      color: 'error'
    })
  }
}

const columns: Ref<TableColumn<Role>[]> = ref([
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
        onClick: () => roleToShow.value = row.original.id
      }, row.getValue('name'))
    }
  }
])

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
  roleToShow.value = entityId
  showListEditorModal.value = false
}

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
  console.log(allRoles.value)
})
</script>

<template>
  <UDashboardPanel id="roles">
    <template #header>
      <UDashboardNavbar title="Роли">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <RolesViewModal
            :roleId="roleToShow"
            @after:leave="roleToShow = ''"
            @refresh-groups-list="refreshHandler"
            @edit-list="launchListEditing"
          />

          <RolesAddModal @refresh-groups-list="refreshHandler()" />

          <ListEditor
            :list-edit-data="listEditData"
            :show-modal="showListEditorModal"
            @refresh-list="refreshHandler"
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
        :key="allRoles.length"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        class="shrink-0"
        :data="allRoles"
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
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length}} из
          {{ table?.tableApi?.getFilteredRowModel().rows.length }} строк выбрано.
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
