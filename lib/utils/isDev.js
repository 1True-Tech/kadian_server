/**
 * Returns true if the current environment is "development".
 *
 * @returns {boolean}
 */
export default function isDev() {
  return process.env.NODE_ENV === "development";
}
