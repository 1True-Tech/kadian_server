/**
 * @typedef {Object} RefreshBody
 * @property {string} refreshToken
 */

import { validateRequest } from "../../../lib/middleware/validateRequest.js";
import { z } from 'zod';
import { refreshAccessToken } from "../../../lib/middleware/refreshToken.js";
import logger from "../../../lib/utils/logger.js";

// Validation schema for refresh token
export const refreshValidation = validateRequest({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
});

/**
 * @param {Omit<import("../../../lib/utils/routeHandler.js").RouteEvent, 'body'> & { body: RefreshBody }} event
 * @returns {Partial<generalResponse>}
 */
export default async function refresh(event) {
  try {
    // The validation is handled by the refreshValidation middleware
    const { refreshToken } = event.body;
    
    // Use the refreshToken middleware to handle token refresh
    const result = await new Promise((resolve) => {
      const mockRes = {
        status: (code) => ({
          json: (data) => resolve({ statusCode: code, ...data })
        })
      };
      
      refreshAccessToken({ body: { refreshToken } }, mockRes);
    });
    
    return {
      data: { accessToken: result.accessToken },
      statusCode: result.statusCode || 200,
      message: result.message || "Token refreshed successfully"
    };
  } catch (error) {
    logger.auth.error({ error: error.message }, "Error in refresh token route");
    return {
      data: null,
      statusCode: 500,
      message: "Internal server error"
    };
  }
}