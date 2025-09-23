/**
 * Refresh token middleware for JWT authentication
 */
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';
import env from '../constants/env.js';
import logger from '../utils/logger.js';

const { JWT_REFRESH_SECRET, JWT_ACCESS_SECRET } = env;
const TOKEN_EXPIRY = '7d';

/**
 * Middleware to refresh JWT access token using refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      logger.auth.warn('Refresh token missing');
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        logger.auth.warn({ error: err.message }, 'Invalid refresh token');
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      try {
        // Find user by ID from token
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          logger.auth.warn({ userId: decoded.userId }, 'User not found for refresh token');
          return res.status(404).json({ message: 'User not found' });
        }

        // Generate new access token
        const accessToken = jwt.sign(
          { userId: user._id.toString(), role: user.role },
          JWT_ACCESS_SECRET,
          { expiresIn: TOKEN_EXPIRY }
        );

        logger.auth.info({ userId: user._id }, 'Access token refreshed successfully');
        return res.status(200).json({ accessToken });
      } catch (error) {
        logger.auth.error({ error: error.message }, 'Database error during token refresh');
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  } catch (error) {
    logger.auth.error({ error: error.message, stack: error.stack }, 'Token refresh error');
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default { refreshAccessToken };