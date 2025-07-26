/**
 * Checks if a URL is reachable by sending a HEAD request within a specified timeout.
 *
 * @param {string} [url='https://www.google.com'] - The URL to ping.
 * @param {number} [timeoutMs=5000] - Timeout in milliseconds before aborting.
 * @returns {Promise<boolean>} - Resolves to true if reachable (status OK), false otherwise.
 */
export default async function pingUrl(url = 'https://www.google.com', timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
