import CHANGE_ROLES from "~/graphql/mutations/changeRoles.graphql";

export default async function changeRolesService(data) {
  const { mutate } = useMutation(CHANGE_ROLES)
  return mutate(data);
}
