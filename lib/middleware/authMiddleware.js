/**
 * Authentication middleware for JWT token validation and role-based access control
 */
import jwt from 'jsonwebtoken';
import env from '../constants/env.js';
import logger from '../utils/logger.js';

const { JWT_ACCESS_SECRET } = env;

/**
 * Middleware to verify JWT access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.auth.warn({ path: req.path }, 'Missing or invalid authorization header');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.auth.warn({ path: req.path }, 'No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          logger.auth.info({ path: req.path }, 'Token expired');
          return res.status(401).json({ 
            message: 'Token expired', 
            code: 'TOKEN_EXPIRED' 
          });
        }
        
        logger.auth.warn({ path: req.path, error: err.message }, 'Invalid token');
        return res.status(403).json({ message: 'Invalid token' });
      }

      // Add user info to request object
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.auth.error({ error: error.message, stack: error.stack }, 'Authentication error');
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has required role
 * @param {...String} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.auth.warn({ path: req.path }, 'User not authenticated for role check');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      logger.auth.warn({ 
        path: req.path, 
        userRole: req.user.role, 
        requiredRoles: roles 
      }, 'Insufficient permissions');
      
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export default { verifyToken, requireRole };