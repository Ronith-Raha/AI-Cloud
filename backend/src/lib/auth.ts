import { DEV_USER_ID } from "@/lib/constants";

/**
 * Extract the authenticated user ID from the request.
 *
 * Checks for an `x-user-id` header first (set by an upstream auth
 * middleware / gateway). Falls back to DEV_USER_ID so existing
 * single-user / dev setups continue to work.
 *
 * TODO: Replace header check with a real auth layer (Clerk, NextAuth, JWT).
 */
export const getUserId = (request: Request): string => {
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }
  return DEV_USER_ID;
};
