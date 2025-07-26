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
 * Utility type for representing deeply nested dot notation keys.
 * @template T
 * @typedef {Extract<keyof T, string> | `${Extract<keyof T, string>}.${string}`} DotNestedKeys
 */
