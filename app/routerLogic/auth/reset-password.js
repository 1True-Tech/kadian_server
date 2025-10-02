import User from "../../../models/user.js";
import { z } from "zod";
import logger from "../../../lib/utils/logger.js";

/**
 * Handle password reset
 * @param {Object} event - The request event
 * @param {Object} event.body - Request body
 * @param {string} event.body.token - Reset token
 * @param {string} event.body.password - New password
 */
export default async function resetPassword(event) {
  try {
    // 1. Validate request body
    const schema = z.object({
      token: z.string().min(1, "Token is required"),
      password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(
          /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
          "Password must contain at least one uppercase letter, one number, and one special character"
        ),
    });

    const { token, password } = schema.parse(event.body);

    // 2. Find user with valid reset token
    const user = await User.findOne({
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.auth.warn("Invalid or expired password reset token");
      return {
        statusCode: 400,
        body: {
          message: "Password reset token is invalid or has expired",
        },
      };
    }

    // 3. Verify the token
    const isValidToken = user.verifyResetToken(token);
    
    if (!isValidToken) {
      logger.auth.warn({ userId: user._id }, "Invalid password reset token");
      return {
        statusCode: 400,
        body: {
          message: "Password reset token is invalid",
        },
      };
    }

    // 4. Set new password and clear reset token fields
    user.setPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    logger.auth.info({ userId: user._id }, "Password reset successful");

    return {
      statusCode: 200,
      body: {
        message: "Password has been reset successfully",
      },
    };
  } catch (error) {
    logger.auth.error({ error: error.message }, "Error in reset password route");
    
    return {
      statusCode: error.name === "ZodError" ? 400 : 500,
      body: {
        message: error.name === "ZodError" 
          ? error.errors[0].message 
          : "An error occurred while processing your request",
      },
    };
  }
}