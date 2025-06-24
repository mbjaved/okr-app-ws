// Centralized utility to enrich owners with user data for avatars and display
export interface EnrichedOwner {
  _id: string;
  name?: string;
  avatarUrl?: string;
}

export function enrichOwnersWithUserData(
  owners: (string | { _id?: string; userId?: string; name?: string; avatarUrl?: string })[],
  users: { _id: string; name?: string; avatarUrl?: string }[]
): EnrichedOwner[] {
  if (!owners || owners.length === 0) return [];
  return owners.map(owner => {
    const id = typeof owner === 'string'
      ? owner
      : owner._id || owner.userId || owner.name || '';
    const user = users.find(u => u._id === id);
    let name = user?.name || (typeof owner === 'object' && owner.name ? owner.name : undefined);
    // If name is missing or looks like a number or ObjectId, fallback to 'User'
    if (!name || /^[0-9a-fA-F]{8,}$/.test(name) || /^\d+$/.test(name)) {
      name = 'User';
    }
    return {
      _id: id,
      name,
      avatarUrl: user?.avatarUrl || (typeof owner === 'object' ? owner.avatarUrl : undefined)
    };
  });
}
