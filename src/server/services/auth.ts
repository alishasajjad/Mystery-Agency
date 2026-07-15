import { context, reddit } from '@devvit/web/server';

/**
 * The only trusted source of user identity is Devvit's request context.
 * Never read a client-supplied header for identity — it is spoofable.
 */
export function getUserId(): string | null {
  return context.userId ?? null;
}

/**
 * Returns true when the current request is made by a moderator of the current
 * subreddit. Used to gate all admin / mutation endpoints server-side so the
 * client cannot self-authorize (previously "admin" was a localStorage flag).
 */
export async function isModerator(): Promise<boolean> {
  try {
    const subredditName = context.subredditName;
    const user = await reddit.getCurrentUser();
    if (!user || !subredditName) return false;
    const perms = await user.getModPermissionsForSubreddit(subredditName);
    return perms.length > 0;
  } catch (error) {
    console.error('isModerator check failed:', error);
    return false;
  }
}
