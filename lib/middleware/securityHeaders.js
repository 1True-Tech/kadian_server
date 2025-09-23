/**
 * Security headers middleware
 * Uses Helmet to add essential security headers to all responses
 */
import helmet from 'helmet';
import env from '../constants/env.js';

// Configure Helmet with appropriate security settings
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
    // Only enable HSTS in production
    enabled: env.NODE_ENV === 'production'
  },
  noSniff: true,
  xssFilter: true,
  // Additional protections
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  expectCt: {
    enforce: true,
    maxAge: 86400 // 1 day in seconds
  }
});

export default helmetMiddleware;