import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../models/user.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myCartDelete(event) {
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
    const user = await User.findById(token.data.userId).select(
      "-password -__v"
    );

    if (!user) {
      return {
        connectionActivity: isOnline,
        statusCode: 404,
        status: "bad",
        message: "User not found",
        success: false,
      };
    }

    const clearedUserCartList = await User.findByIdAndUpdate(
      token.data.userId,
      { $set: { cart: [] } },
      { new: true }
    );

    if (!clearedUserCartList) {
      return {
        connectionActivity: isOnline,
        statusCode: 500,
        status: "bad",
        message:
          "something went wrong: user cart can't be cleared at the moment",
        success: false,
      };
    }
    return {
      connectionActivity: isOnline,
      statusCode: 200,
      status: "good",
      message: "User cart cleared successfully",
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Failed to clear user cart data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
