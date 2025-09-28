import https from "https";

/**
 * Checks if a web API is reachable over HTTP/HTTPS
 * @param {string} url - The URL to test
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<boolean>} True if reachable
 */
export default function checkHttpConnectivity(url = "https://example.com", timeoutMs = 5000) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      // Success if status code is 2xx or 3xx
      resolve(res.statusCode >= 200 && res.statusCode < 400);
      res.destroy(); // Close the socket immediately
    });

    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}
