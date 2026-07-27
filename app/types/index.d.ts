type ID = string

export type MutationResponse<K extends string, T> = {
  data: Record<K, T>
}

export type QueryResponse<K extends string, T> = {
  data: {
    value: Record<K, T>
  }
  refresh: Function
}

export interface GraphQlEntity {
  id :ID
  name?: string
  __typename?: string
}

export type ApolloError = {
  message: string
  stack: string
}

// ----------------------------------------------------

type DocumentActions = {
  many: {
    actions: {
      create: boolean
      delete: boolean
      read: boolean
      update: boolean
    }
  }
  one: {
    actions: {
      create: boolean
      delete: boolean
      read: boolean
      update: boolean
    }
  }
}

export interface Role extends GraphQlEntity {
  documents: Record<string, DocumentActions>
  members: User[] | []
  transliterate_name: string
}

export interface GroupShort extends GraphQlEntity {
  name: string
}

export type Group = {
  _id: ID
  children: [Group] | []
  id: ID
  isExpandedAccess: Boolean
  name: String
  parent: Group | null
  parent_id: ID | null
  supervisors: User[] | []
  members: User[] | []
}

// ToDo: interface GroupFull

export type Avatar = {
  _id: ID
  file_id: ID
  filename: String
  id: ID
  minimalR: Number
  minimalX: Number
  minimalY: Number
  user_id: ID
}

export type UserInfo = {
  emails: string[]
  addresses: string[]
  birthday_date: number
  fullname: string
  phones: string[]
  post: string
  user_id: string
  id: string
}

export interface User extends GraphQlEntity {
  _id: ID
  avatar: null
  name: string
  email: string
  banned: boolean
  groups: GroupShort[] | []
  roles: Role[] | []
  created_date: number
  updated_date: number
  service: object | null // ToDo Type
  settings: object | null // ToDo Type
  info: UserInfo | null
}

export type MainEntities = 'users' | 'groups' | 'roles'

export type ListEditData = {
  entityId: string
  oldList: User[] | Group[] | Role[] | []
  target: MainEntities | ''
  source: MainEntities | ''
}
