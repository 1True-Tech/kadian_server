/// <reference path="../../types/index.js" />

/**
 * @template T
 * @typedef {Object} CheckFieldsOptions
 * @property {boolean} [isQuery]
 * @property {string} [label]
 * @property {Partial<Record<DotNestedKeys<T>, { action: (value: any) => boolean; message: string }>>} [checkers]
 * @property {T} [defaults]
 */

/**
 * Recursively checks an object’s fields against required paths.
 *
 * @template T
 * @param {T} obj - The object to validate.
 * @param {string[][]} paths - Array of key-paths (each path as array of segments).
 * @param {string} [prefix=""] - Prefix for path in error messages.
 * @param {CheckFieldsOptions<T>} [options={ isQuery: true, label: "object" }] - Validation options.
 * @returns {string[]} - Array of error messages.
 */
function checkFieldsRecursive(obj, paths, prefix = "", options = { isQuery: true, label: "object" }) {
  const messages = [];
  /** @type {Record<string, string[][]>} */
  const grouped = {};

  for (const pathArr of paths) {
    if (pathArr.length === 0) continue;
    const [first, ...rest] = pathArr;
    if (!grouped[first]) grouped[first] = [];
    grouped[first].push(rest);
  }

  for (const key in grouped) {
    const fullPath = prefix
      ? `${prefix}${options.isQuery ? "?" : "."}${key}`
      : key;
    const value = obj?.[key];

    // If there are nested segments, recurse
    const childPaths = grouped[key].filter(arr => arr.length > 0);
    if (childPaths.length > 0) {
      if (value === undefined || value === null) {
        messages.push(`${options.label} is Missing ${fullPath}`);
      } else {
        messages.push(...checkFieldsRecursive(value, childPaths, fullPath, options));
      }
    } else {
      // Leaf node: check existence and default
      if (
        value === undefined ||
        value === null ||
        (typeof value !== "object" && value === "")
      ) {
        messages.push(`${options.label} is Missing ${fullPath}`);
      } else if (options.defaults && value === options.defaults[key]) {
        messages.push(
          `${options.label} ${fullPath} should not have a default value since it is required`
        );
      }
    }
  }

  if (options.checkers) {
    for (const [flatKey, checker] of Object.entries(options.checkers)) {
      const segments = flatKey.split(".");
      let current = obj;
      let failed = false;

      for (const segment of segments) {
        if (current == null || typeof current !== "object") {
          failed = true;
          break;
        }
        current = current[segment];
      }

      if (!failed && !checker.action(current)) {
        const fullPath = prefix
          ? `${prefix}${options.isQuery ? "?" : "."}${flatKey}`
          : flatKey;

        const constructedMessage = checker.message.replace(
          "{{value}}",
          JSON.stringify(current)
        );
        messages.push(`${options.label} ${fullPath} is invalid: ${constructedMessage}`);
      }
    }
  }

  return messages;
}

/**
 * @template T The object type being validated.
 * @template K Keys from T (in dot-notation) that are required and may have checkers.
 * 
 * @typedef {Object} ObjectErrorBoundaryOptions
 * @property {string} [label] - Optional label for error messages.
 * @property {boolean} [isQuery] - Whether this object is part of a query context.
 * @property {string} [prefix] - Optional prefix for error messages.
 * @property {Partial<T>} [defaults] - Default values to fall back to.
 * @property {Partial<Record<K, {
 *   action: (value: any) => boolean;
 *   message: string;
 * }>>} [checkers] - Validation rules for required fields only.
 */

/**
 * Wraps an object in validation logic, returning errors and defaults.
 *
 * @template T The object type being validated.
 * @template {DotNestedKeys<T>} K Dot-notation keys that are required.
 *
 * @param {T} object - The object to validate.
 * @param {Array<K>} requiredFields - Dot-notated keys that must be present and valid.
 * @param {ObjectErrorBoundaryOptions<T, K>} [options] - Validation options and rules.
 * @returns {{ hasError: boolean; errorMessage: string; object: T }}
 */
export default function objectErrorBoundary(object, requiredFields, options) {
  const extendedOptions = {
    label: "Object",
    isQuery: false,
    ...options
  };
  const messages = [];
  const uniqueFields = Array.from(new Set(requiredFields));
  const constructedObject = { ...extendedOptions.defaults, ...object };
  const paths = uniqueFields.map(f => String(f).split("."));

  if (!object) {
    messages.push(`${extendedOptions.label} is required`);
  }
  messages.push(
    ...checkFieldsRecursive(constructedObject, paths, extendedOptions.prefix, extendedOptions)
  );

  return {
    hasError: messages.length > 0,
    errorMessage: messages.join(", "),
    object: constructedObject,
  };
}

