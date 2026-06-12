// Single source of truth for "who is the current user".
// v1 is a single anonymous local user; swapping in real auth later is a one-line change.
export const LOCAL_USER_ID = 'local'

export function currentUserId(): string {
  return LOCAL_USER_ID
}
