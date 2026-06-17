import AUTH from "~/graphql/mutations/Auth.graphql";

export default async function authUser(data) {
  const { mutate } = useMutation(AUTH)
  return mutate(data);
}
