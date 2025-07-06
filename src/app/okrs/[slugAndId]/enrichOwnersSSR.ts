import { enrichOwnersWithUserData } from "../../../lib/enrichOwnersWithUserData";

export async function enrichOwnersSSR(owners: any[], fetchUsers: () => Promise<any[]>): Promise<any[]> {
  const users = await fetchUsers();
  return enrichOwnersWithUserData(owners, users);
}
