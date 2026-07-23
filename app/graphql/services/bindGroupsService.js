import BIND_GROUPS from "~/graphql/mutations/BindRoles.graphql";

export default async function bindGroupsService(data) {
  const { mutate } = useMutation(BIND_GROUPS)
  return mutate(data);
}
