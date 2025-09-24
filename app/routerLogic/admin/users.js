import User from "../../../models/user.js";
import connectDbUsers from "../../../lib/utils/mongo/connect-db-users.js";
import mongoose from "mongoose";

/**
 * @typedef {Object} UserResponse
 * @property {string} id - User's ID
 * @property {string} email - User's email
 * @property {Object} name - User's name object
 * @property {string} name.first - First name
 * @property {string} name.last - Last name
 * @property {string} role - User's role
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Validate if the requesting user has admin privileges
 * @param {Object} auth - Auth object from the request event
 * @throws {Error} If user is not admin
 */
function validateAdmin(auth) {
  if (!auth || !auth.userId ||( auth.userRole !== "admin" && auth.userRole !== "superadmin")) {
    const error = new Error("Unauthorized access");
    error.statusCode = 403;
    throw error;
  }
}

const now = Date.now();
const days30 = 1000 * 60 * 60 * 24 * 30; // 30 days in ms

function toDate(lastSeen) {
  if (!lastSeen) return null;

  if (lastSeen instanceof Date) return lastSeen;

  if (typeof lastSeen === "number") {
    // If it's too small, it's probably seconds, so multiply
    return new Date(lastSeen < 1e12 ? lastSeen * 1000 : lastSeen);
  }

  if (typeof lastSeen === "string") {
    const parsed = Date.parse(lastSeen);
    if (!isNaN(parsed)) return new Date(parsed);
  }

  return lastSeen;
}

/**
 * Get all users from the users API
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event
 * @returns {Promise<Object>} Response object
 */
export const getAllUsers = async (event) => {
  validateAdmin(event.auth);

  await connectDbUsers();
  const users = await User.find({})
    .select("email name role _createdAt _updatedAt lastSeen")
    .sort({ createdAt: -1 })
    .lean();

  const sanitizedUsers = users
    .filter((user) => user._id.toString() !== event.auth.userId.toString())
    .map((user) => {
      const lastSeenDate = toDate(user.lastSeen);
      const isActive = !!lastSeenDate && now - lastSeenDate.getTime() <= days30;
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name || { first: "N/A", last: "N/A" },
        role: user.role || "user",
        lastSeen: toDate(user.lastSeen),
        isActive,
        createdAt: user._createdAt,
        updatedAt: user._updatedAt,
      };
    });


  return {
    statusCode: 200,
    message: "Users retrieved successfully",
    data: sanitizedUsers,
  };
};

/**
 * Update a user's role
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - The request event
 * @returns {Promise<Object>} Response object
 */
export const updateUserRole = async (event) => {
  validateAdmin(event.auth);

  const { userId } = event.params;
  const { role } = event.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return {
      statusCode: 400,
      message: "Invalid or missing user ID",
    };
  }

  if (!role || !["user", "admin"].includes(role)) {
    return {
      statusCode: 400,
      message: "Invalid role specified",
    };
  }

  await connectDbUsers();

  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  if (event.auth.userRole !== "superadmin" && (targetUser.role === "admin" && role !== "admin")) {
    return {
      statusCode: 403,
      message: "Cannot modify another admin's role",
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  )
    .select("email name role")
    .lean();

  return {
    statusCode: 200,
    message: "User role updated successfully",
    data: {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    },
  };
};
/**
 * Delete a user account
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - The request event
 * @returns {Promise<Object>} Response object
 */
export const deleteUser = async (event) => {
  validateAdmin(event.auth);

  const { userId } = event.params;
  if (!userId) {
    return {
      statusCode: 400,
      message: "User ID is required",
    };
  }

  await connectDbUsers();

  // Check if trying to delete an admin
  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  if (targetUser.role === "admin") {
    return {
      statusCode: 403,
      message: "Cannot delete admin users",
    };
  }

  // Delete the user
  await User.findByIdAndDelete(userId);

  return {
    statusCode: 200,
    message: "User deleted successfully",
    data: { id: userId },
  };
};

/**
 * Get user details for admin view (excludes sensitive data)
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - The request event
 * @returns {Promise<Object>} Response object
 */
export const getUserDetails = async (event) => {
  validateAdmin(event.auth);

  const { userId } = event.params;
  if (!userId) {
    return {
      statusCode: 400,
      message: "User ID is required",
    };
  }

  await connectDbUsers();
  const user = await User.findById(userId)
    .select("email name role createdAt updatedAt")
    .lean();

  if (!user) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  const sanitizedUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name || { first: "N/A", last: "N/A" },
    role: user.role || "user",
    isVerified: user.isVerified || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    statusCode: 200,
    message: "User details retrieved successfully",
    data: sanitizedUser,
  };
};

/**
 * Update user's verification status
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - The request event
 * @returns {Promise<Object>} Response object
 */
export const updateUserVerification = async (event) => {
  validateAdmin(event.auth);

  const { userId } = event.params;
  const { isVerified } = event.body;

  if (!userId) {
    return {
      statusCode: 400,
      message: "User ID is required",
    };
  }

  if (typeof isVerified !== "boolean") {
    return {
      statusCode: 400,
      message: "Invalid verification state specified. Must be true or false",
    };
  }

  await connectDbUsers();

  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  if (targetUser.role === "admin") {
    return {
      statusCode: 403,
      message: "Cannot modify admin user verification status",
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isVerified },
    { new: true }
  )
    .select("email name role isVerified")
    .lean();

  return {
    statusCode: 200,
    message: "User verification status updated successfully",
    data: {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    },
  };
};
