import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../models/user.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myWishlist(event) {
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
    // 2. Get user data (auth.userId is available from withErrorHandling)
    const user = await User.findById(event.auth?.userId).select(
      "-password -__v"
    );
    if (!user) {
      return {
        statusCode: 404,
        message: "User not found",
      };
    }

    // 3. Return cart data
    return {
      statusCode: 200,
      message: "User wishlist retrieved successfully",
      data: processUserData(user).wishList || [],
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user wishlist: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
