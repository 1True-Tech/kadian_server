import User from "../../../models/user.js";

/**
 * Change user password
 * @param {import("../../../lib/utils/withErrorHandling.js").RouteEvent} event - Express response object
 * @returns {Partial<generalResponse>}
 */
const changePassword = async (event) => {
  const { currentPassword, newPassword } = event.body || {};
  const userId = event.auth.userId;

  // Validate input
  if (!currentPassword || !newPassword) {
    return {
      data: null,
      statusCode: 400,
      status: "bad",
      message: "Current password and new password are required",
    };
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return {
      data: null,
      statusCode: 404,
      status: "bad",
      message: "User not found",
    };
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return {
      data: null,
      statusCode: 400,
      status: "bad",
      message: "Current password is incorrect",
    };
  }

  // Password strength validation
  if (newPassword.length < 8) {
    return {
      data: null,
      statusCode: 400,
      status: "bad",
      message: "Password must be at least 8 characters",
    };
  }

  if (!/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword)) {
    return {
      data: null,
      statusCode: 400,
      status: "bad",
      message: "Password must contain at least one uppercase letter, one number, and one special character",
    };
  }

  // Set new password
  user.password = newPassword;
  await user.save();

  return {
    data: null,
    statusCode: 200,
    status: "good",
    message: "Password changed successfully",
  };
};

export default changePassword;