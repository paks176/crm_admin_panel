import BIND_ROLES from "~/graphql/mutations/BindRoles.graphql";

export default async function bindRolesService(data) {
  const { mutate } = useMutation(BIND_ROLES)
  return mutate(data);
}
