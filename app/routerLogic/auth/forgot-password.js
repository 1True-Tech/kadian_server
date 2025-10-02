import User from "../../../models/user.js";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../lib/utils/emailService.js";
import logger from "../../../lib/utils/logger.js";

/**
 * Handle forgot password request
 * @param {Object} event - The request event
 * @param {Object} event.body - Request body
 * @param {string} event.body.email - User email
 */
export default async function forgotPassword(event) {
  try {
    // 1. Validate request body
    const schema = z.object({
      email: z.string().email("Invalid email format"),
    });

    const { email } = schema.parse(event.body);

    // 2. Find user by email
    const user = await User.findOne({ email });
    
    // 3. If no user found, still return success to prevent email enumeration
    if (!user) {
      logger.auth.warn({ email }, "Password reset requested for non-existent email");
      return {
        statusCode: 200,
        body: {
          message: "If your email is registered, you will receive password reset instructions",
        },
      };
    }

    // 4. Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // 5. Store hashed token in user document
    user.generateResetToken(resetToken);
    await user.save();

    // 6. Create reset URL
    const resetUrl = `${event.req.headers.origin || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // 7. Send email with reset link
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
    
    if (!emailResult.success) {
      logger.auth.error({ error: emailResult.error }, "Failed to send password reset email");
      // If email fails, remove token from user
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return {
        statusCode: 500,
        body: {
          message: "An error occurred while processing your request. Please try again later.",
        },
      };
    }

    logger.auth.info({ userId: user._id }, "Password reset email sent");

    return {
      statusCode: 200,
      body: {
        message: "If your email is registered, you will receive password reset instructions",
      },
    };
  } catch (error) {
    logger.auth.error({ error: error.message }, "Error in forgot password route");
    
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