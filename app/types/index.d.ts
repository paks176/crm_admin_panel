type ID = string

export type MutationResponse<K extends string, T> = {
  data: Record<K, T>
}

export type QueryResponse<K extends string, T> = {
  data: {
    value: Record<K, T>
  }}

export interface GraphQlEntity {
  id :ID
  name?: string
  __typename: string
}

export type ApolloError = {
  message: string
  stack: string
}

export interface Role extends GraphQlEntity {
  name: string
}

export interface GroupShort extends GraphQlEntity {
  name: string
}

// ToDo: interface GroupFull

export interface User extends GraphQlEntity {
  name: string
  email: string
  banned: boolean
  groups: GroupShort[]
  roles: Role[]
  created_date: number
  updated_date: number
}
