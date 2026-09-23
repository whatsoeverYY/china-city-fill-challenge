export type WorldAccessState = "checking" | "locked" | "unlocked";

export function isWorldAuthorizationPending(
  initialized: boolean,
  identityId: string | null,
  profileId: string | null,
) {
  return !initialized || Boolean(
    identityId && profileId !== identityId,
  );
}
