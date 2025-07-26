/** @typedef {import('./types').DotNestedKeys} DotNestedKeys */

/**
 * @template T
 * @typedef {Object} CheckFieldsOptions
 * @property {boolean} [isQuery]
 * @property {string} [label]
 * @property {Partial<Record<keyof T, { action: (value: any) => boolean; message: string }>>} [checkers]
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
    for (const key of Object.keys(options.checkers)) {
      const checker = options.checkers[key];
      const fullPath = prefix
        ? `${prefix}${options.isQuery ? "?" : "."}${key}`
        : key;
      const value = obj?.[key];
      if (checker && !checker.action(value)) {
        const constructedMessage = checker.message.replace(
          "{{value}}",
          JSON.stringify(value)
        );
        messages.push(`${options.label} ${fullPath} is invalid: ${constructedMessage}`);
      }
    }
  }

  return messages;
}

/**
 * @template T
 * @typedef {Object} ObjectErrorBoundaryOptions
 * @property {string} [label]
 * @property {boolean} [isQuery]
 * @property {string} [prefix]
 * @property {Partial<T>} [defaults]
 * @property {Partial<Record<keyof T, {
 *   action: (value: any) => boolean;
 *   message: string;
 * }>>} [checkers]
 *
 * Note: In `message` you can use `{{value}}` to interpolate the actual
 * value in your custom error messages.
 */

/**
 * Wraps an object in validation logic, returning errors and defaults.
 *
 * @template T
 * @param {T|undefined} object - The object to validate.
 * @param {Array<DotNestedKeys>|string[]} requiredFields - Required field paths.
 * @param {ObjectErrorBoundaryOptions<T>} [options] - Validation options.
 * @returns {{ hasError: boolean; errorMessage: string; object: T|undefined }}
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
