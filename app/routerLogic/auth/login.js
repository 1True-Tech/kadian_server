/**
 * @typedef {Object} LoginBody
 * @property {string} username
 * @property {string} password
 */

import connectDbUsers from "../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../models/user.js";
import { validateRequest, commonSchemas } from "../../../lib/middleware/validateRequest.js";
import { z } from 'zod';
import logger from "../../../lib/utils/logger.js";

// Validation schema for login
export const loginValidation = validateRequest({
  body: commonSchemas.user.login
});

/**
 * @param {Omit<import("../../../lib/utils/routeHandler.js").RouteEvent, 'body'> & { body: LoginBody }} event
 * @returns {Partial<generalResponse>}
 */
export default async function login(event) {
  // Validation is now handled by the loginValidation middleware
  const body = event.body;
  const clientIp = event.headers['x-forwarded-for'] || event.connection?.remoteAddress;

  // 2. Connect to database
  try {
    await connectDbUsers();
  } catch (error) {
    logger.auth.error({ error: error.message }, "Database connection error during login");
    return {
      data: null,
      statusCode: 500,
      message: "Login failed: Database connection error",
    };
  }

  // 3. Find and validate user
  try {
    const existingUser = await User.findOne({ username: { $eq: body.username } }).select(
      "+password +loginAttempts +lockUntil"
    );
    
    if (!existingUser) {
      logger.auth.warn({ username: body.username, ip: clientIp }, "Login attempt with invalid username");
      return {
        data: null,
        statusCode: 401,
        message: "Invalid username or password",
      };
    }
    
    // Check if account is locked
    if (existingUser.isLocked) {
      logger.auth.warn({ username: body.username, ip: clientIp }, "Login attempt on locked account");
      return {
        data: null,
        statusCode: 429,
        message: "Account temporarily locked due to too many failed attempts. Try again later.",
      };
    }

    const passwordIsCorrect = existingUser.comparePassword(body.password);
    if (!passwordIsCorrect) {
      // Increment failed login attempts
      await existingUser.incrementFailedLogin();
      logger.auth.warn({ username: body.username, ip: clientIp }, "Failed login attempt with incorrect password");
      return {
        data: null,
        statusCode: 401,
        message: "Invalid username or password",
      };
    }

    // Reset login attempts on successful login
    existingUser.loginAttempts = 0;
    existingUser.lockUntil = null;
    await existingUser.save();

    const authTokens = existingUser.generateAuthToken();
    
    logger.auth.info({ userId: existingUser._id }, "User logged in successfully");

    return {
      statusCode: 200,
      message: "Sign in successful.",
      data: authTokens,
    };
  } catch (error) {
    return {
      message: `Login failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      data: null,
      statusCode: 500,
    };
  }
}
