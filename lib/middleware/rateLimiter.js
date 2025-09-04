import { LRUCache } from "lru-cache";

// Rate limiting cache
const rateLimitCache = new LRUCache({
  max: 1000, // Maximum number of IPs to track
  ttl: 15 * 60 * 1000, // 15 minutes
});

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @returns {Function} Express middleware function
 */
export function createRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = "Too many requests, please try again later.",
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    
    // Get current request count for this IP
    const requestData = rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };
    
    // Reset counter if window has expired
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + windowMs;
    }
    
    // Increment request count
    requestData.count++;
    
    // Update cache
    rateLimitCache.set(key, requestData);
    
    // Check if limit exceeded
    if (requestData.count > max) {
      return res.status(429).json({
        status: "bad",
        statusCode: 429,
        message,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - requestData.count),
      'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString(),
    });
    
    next();
  };
}

// Predefined rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: "Too many requests, please try again later.",
});