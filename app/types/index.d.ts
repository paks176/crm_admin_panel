type ID = string

export interface GraphQlResponse {
  id :ID
  name?: string
  __typename: string
}

export type ApolloError = {
  message: string
  stack: string
}

export interface Role extends GraphQlResponse {
  name: string
}

export interface GroupShort extends GraphQlResponse {
  name: string
}

// ToDo: interface GroupFull

export interface User extends GraphQlResponse {
  name: string
  email: string
  banned: boolean
  groups: GroupShort[]
  roles: Role[]
  created_date: number
  updated_date: number
}
