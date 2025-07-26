/**
 * @typedef {'online'|'offline'} activityStatus
 */

/**
 * @typedef {'good'|'bad'} healthStatus
 */

/**
 * @typedef {Object} pagination
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * @typedef {Object} generalResponse
 * @property {healthStatus} status
 * @property {activityStatus} connectionActivity
 * @property {number} statusCode
 * @property {string} [message]
 */

/**
 * Shared helper for nested‐key lookup in JSdoc.
 *
 * @template T
 * @typedef { Extract<keyof T, string>
 *            | `${Extract<keyof T, string>}.${string}` }
 * DotNestedKeys
 */
