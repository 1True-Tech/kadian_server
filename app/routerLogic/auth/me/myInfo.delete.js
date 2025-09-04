import processUserData from "../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../models/user.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling.js").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myInfoDelete(event) {
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
    // Delete user account
    const deletedUser = await User.deleteOne({ _id: auth.userId });

    // Handle deletion failure
    if (!deletedUser.deletedCount) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found or deletion failed",
        success: false,
      };
    }

    // Return success response
    return {
      statusCode: 200,
      status: "good",
      message: "User account deleted successfully",
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Failed to delete user account: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
