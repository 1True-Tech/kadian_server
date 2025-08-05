/**
 * Represents possible activity states.
 * @typedef {'online' | 'offline'} activityStatus
 */

/**
 * Represents health check result status.
 * @typedef {'good' | 'bad'} healthStatus
 */

/**
 * Represents pagination details for paginated responses.
 * @typedef {Object} pagination
 * @property {number} page - Current page number.
 * @property {number} pageSize - Number of items per page.
 * @property {number} total - Total number of items.
 * @property {number} totalPages - Total number of pages.
 */

/**
 * Standard API response structure used across endpoints.
 * @typedef {Object} generalResponse
 * @property {healthStatus} status - Health status of the system.
 * @property {activityStatus} connectionActivity - Current activity state.
 * @property {number} statusCode - HTTP-like status code for operation result.
 * @property {string} [message] - Optional message describing the result.
 */



/**
 * A utility type that represents all possible dot-notation key paths of a nested object `T`.
 *
 * This excludes arrays, functions, and built-in object prototypes like strings and dates.
 *
 * For example, given:
 * ```ts
 * const obj = {
 *   user: {
 *     profile: {
 *       name: string;
 *     },
 *     age: number;
 *   },
 *   isAdmin: boolean;
 * };
 * ```
 *
 * `DotNestedKeys<typeof obj>` will include:
 * - "user"
 * - "user.profile"
 * - "user.profile.name"
 * - "user.age"
 * - "isAdmin"
 *
 * @template T The object type to extract dot-notated keys from
 * @typedef {(
 *   T extends object
 *     ? {
 *         [K in Extract<keyof T, string>]:
 *           NonPlainObject<T[K]> extends true
 *             ? K
 *             : K | `${K}.${DotNestedKeys<T[K]>}`
 *       }[Extract<keyof T, string>]
 *     : never
 * )} DotNestedKeys
 */

/**
 * Helper type that returns true if `T` is not a plain object (e.g., string, array, function).
 * @template T
 * @typedef {(
 *   T extends string | number | boolean | bigint | symbol | null | undefined | Function | Date | any[]
 *     ? true
 *     : false
 * )} NonPlainObject
 */