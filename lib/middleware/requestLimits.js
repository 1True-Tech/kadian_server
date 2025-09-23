/**
 * Request size limits middleware
 * Protects against large payload attacks by limiting request sizes
 */

// Define size limits for different types of requests
const limits = {
  // General request size limit (2MB)
  general: '2mb',
  // Smaller limit for authentication requests (100KB)
  auth: '100kb',
  // Larger limit for image uploads (10MB)
  images: '10mb',
  // Medium limit for product data (5MB)
  products: '5mb'
};

/**
 * Get appropriate size limit based on request path
 * @param {Object} req - Express request object
 * @returns {string} Size limit
 */
function getSizeLimit(req) {
  const path = req.path.toLowerCase();
  
  if (path.startsWith('/auth')) {
    return limits.auth;
  } else if (path.startsWith('/images') || path.includes('/upload')) {
    return limits.images;
  } else if (path.includes('/product') || path.includes('/inventory')) {
    return limits.products;
  }
  
  return limits.general;
}

/**
 * Middleware to apply dynamic request size limits
 */
export function dynamicRequestSizeLimit(req, res, next) {
  const sizeLimit = getSizeLimit(req);
  
  // Check if request size exceeds the limit
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = parseInt(sizeLimit.replace(/\D/g, ''), 10) * 
                   (sizeLimit.includes('kb') ? 1024 : 1024 * 1024);
    
    if (size > maxSize) {
      return res.status(413).json({
        status: 'error',
        statusCode: 413,
        message: 'Request entity too large'
      });
    }
  }
  
  next();
}

export default {
  limits,
  dynamicRequestSizeLimit
};