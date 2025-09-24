import processUserData from "../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../models/user.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myInfo(event) {
  const auth = event.auth;
  // Connect to MongoDB
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      statusCode: 500,
      status: "bad",
      message: "Failed to connect to database while fetching user.",
    };
  }
  try {
    // 2. Get user data
    const user = await User.findById(auth.userId);
    if (!user) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found",
      };
    }
    // update last seen
    user.lastSeen = new Date();
    await user.save();

    // 3. Return user profile
    return {
      statusCode: 200,
      status: "good",
      message: "User profile retrieved successfully",
      data:processUserData(user),
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
