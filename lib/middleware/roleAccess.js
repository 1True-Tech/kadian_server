/**
 * Role-based access control middleware
 */
import logger from '../utils/logger.js';

/**
 * Permission definitions for different roles
 */
const rolePermissions = {
  user: [
    'view_products',
    'manage_cart',
    'place_orders',
    'view_own_orders',
    'manage_profile'
  ],
  admin: [
    'view_products',
    'manage_cart',
    'place_orders',
    'view_own_orders',
    'manage_profile',
    'manage_products',
    'manage_inventory',
    'view_all_orders',
    'manage_users',
    'view_analytics'
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Required permission
 * @returns {boolean} Whether the role has the permission
 */
export const hasPermission = (role, permission) => {
  if (!rolePermissions[role]) return false;
  return rolePermissions[role].includes(permission);
};

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 * @returns {Function} Middleware function
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.auth.warn({ path: req.path }, 'User not authenticated for permission check');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { role } = req.user;
    
    if (!hasPermission(role, permission)) {
      logger.auth.warn({ 
        path: req.path, 
        userRole: role, 
        requiredPermission: permission 
      }, 'Permission denied');
      
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
};

export default { hasPermission, requirePermission, rolePermissions };