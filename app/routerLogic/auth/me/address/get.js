import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../models/user.js";

/**
 *
 * @param {import("../../../../../lib/utils/withErrorHandling").RouteEvent} event
 */
export default async function get(event) {
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
    const user = await User.findById(auth.userId);
    if (!user) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found",
      };
    }

    return {
      statusCode: 200,
      message: "User addresses retrieved successfully",
      data: processUserData(user).addresses,
    };
  } catch (error) {
    throw new Error(
      `Failed to retrieve user addresses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
