/**
 * Flattens a nested object into dot notation
 * @param {Object} obj - The object to flatten
 * @param {string} [prefix=''] - The prefix to use for nested keys
 * @returns {Object.<string, any>} Flattened object with dot notation keys
 * @example
 * // Returns { 'a.b': 1, 'a.c': 2 }
 * flattenToDotNotation({ a: { b: 1, c: 2 } })
 */
function flattenToDotNotation(obj, prefix = "") {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flattenToDotNotation(value, newKey));
    } else {
      acc[newKey] = value;
    }
    return acc;
  }, {});
}

export default flattenToDotNotation;