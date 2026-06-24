import CREATE_USER from '~/graphql/mutations/CreateUser.graphql'

export default async function creatGroupService(data) {
  const { mutate } = useMutation(CREATE_USER, )
  return mutate({ createUserEmail2: data.email, name: data.name, createUserPassword2: data.password })
}
