/// <reference path="../../types/user.js" />


export const ROLE_PRIORITY = ["admin", "user"];

/**
 * Given an array of allowedRoles (a subset of UserRole),
 * pick the highest‑priority role, or fall back to "guest".
 * @param {UserRole[]} allowedRoles
 * @returns {UserRole | "guest"}
 */
export default function getAccessTier(allowedRoles) {
  // O(1) lookup
  const allowed = new Set(allowedRoles) ;

  // Find first match in priority order
  const tier = ROLE_PRIORITY.find((r) => allowed.has(r));

  return tier ?? "guest";
}
