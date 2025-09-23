/**
 * Request validation middleware using Zod
 * Provides schema-based validation for request bodies, params, and queries
 */
import { z } from 'zod';

/**
 * Creates a validation middleware for Express routes
 * @param {Object} schemas - Object containing Zod schemas for body, params, query
 * @returns {Function} Express middleware function
 */
export function validateRequest(schemas) {
  return (req, res, next) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      
      // Validate URL parameters if schema provided
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      
      // Validate query string if schema provided
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.errors) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Server error during validation'
      });
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  // User schemas
  user: {
    login: z.object({
      username: z.string().min(4, 'Username must be at least 4 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters')
    }),
    
    register: z.object({
      email: z.string().email('Invalid email format'),
      username: z.string().min(4, 'Username must be at least 4 characters'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 
          'Password must contain at least one uppercase letter, one number, and one special character'),
      name: z.object({
        first: z.string().min(1, 'First name is required').max(50),
        last: z.string().min(1, 'Last name is required').max(50)
      }),
      phone: z.string().regex(/^\+\d{1,15}$/, 'Phone must be in E.164 format').optional()
    })
  },
  
  // ID validation
  id: {
    mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID format')
  },
  
  // Pagination parameters
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10')
  })
};

export default validateRequest;