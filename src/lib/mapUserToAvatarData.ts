// Centralized avatar data mapping utility for all user-like objects

export interface AvatarData {
  name: string;
  avatarUrl?: string;
  initials: string;
}

export type UserLike = {
  name?: string;
  username?: string;
  email?: string;
  _id?: string;
  avatarUrl?: string;
  initials?: string;
};

/**
 * Returns canonical AvatarData for any user-like object.
 * - name: prefers real name, falls back to username/email/ID
 * - avatarUrl: if present, else undefined
 * - initials: derived from name, username, or email
 */
export function mapUserToAvatarData(user: UserLike): AvatarData {
  // Always prefer real name for initials if available
  let name = user.name || user.username || user.email || '';
  // If name is still missing, do not use _id as display name
  if (!name) name = 'User';
  let avatarUrl = user.avatarUrl || undefined;
  let initials = '';

  if (user.name && typeof user.name === 'string') {
    // Use only the real name for initials
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1 && parts[0].length > 1) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length > 1) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = user.name[0].toUpperCase();
    }
  } else if (user.username && typeof user.username === 'string') {
    // Fallback to username only if name is missing
    initials = user.username.slice(0, 2).toUpperCase();
  } else if (user.email && typeof user.email === 'string') {
    // Fallback to email only if name and username are missing
    initials = user.email[0].toUpperCase();
  } else if (user._id && typeof user._id === 'string') {
    initials = user._id[0].toUpperCase();
  } else {
    initials = '?';
  }

  return { name, avatarUrl, initials };
}
