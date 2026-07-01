import UPDATE_USER_INFO from '~/graphql/mutations/UpdateUserInfo.graphql'

export default async function updateUserInfoService(id, input) {
  const { mutate } = useMutation(UPDATE_USER_INFO, )
  return mutate({ id, input })
}
