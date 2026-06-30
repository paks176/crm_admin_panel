import UPDATE_USER_INFO from '~/graphql/mutations/UpdateUserInfo.graphql'

export default async function updateUserInfoService(data) {
  const { mutate } = useMutation(UPDATE_USER_INFO, )
  return mutate({ id: data.id, input: data })
}
