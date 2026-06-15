type ID = string

export interface GraphQlResponse {
  data: {}
}

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
