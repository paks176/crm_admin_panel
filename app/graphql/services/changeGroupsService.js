import CHANGE_GROUPS from "~/graphql/mutations/changeGroups.graphql";

export default async function changeGroupsService(data) {
  const { mutate } = useMutation(CHANGE_GROUPS)
  return mutate(data);
}
