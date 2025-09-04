import { LRUCache } from "lru-cache";

// Create a shared cache instance (only once for your app)
const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // default 5 minutes in ms
});

/**
 * Fetches data and caches it under `key`.
 * If the key already exists and is unexpired, returns the cached value.
 *
 * @template T
 * @param {string} key Unique cache key
 * @param {() => Promise<T>} fetchData An async function that loads fresh data
 * @param {number} [ttlInMin=5] Override default TTL (in minutes)
 * @returns {Promise<T>}
 */
export default async function useCache(key, fetchData, ttlInMin = 5) {
  // Try to get from cache
  const cached = cache.get(key);

  if (cached !== undefined) {
    // cache hit
    return cached;
  }

  // cache miss: fetch fresh data
  const data = await fetchData();

  // store in cache with optional per-entry TTL
  cache.set(key, data, { ttl: 1000 * 60 * ttlInMin });

  return data;
}
