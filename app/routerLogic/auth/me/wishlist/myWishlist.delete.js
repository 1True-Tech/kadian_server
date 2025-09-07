import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../models/user.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myWishlistDelete(event) {
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
    const user = await User.findById(auth.userId).select(
      "-password -__v"
    );

    if (!user) {
      return {
        statusCode: 404,
        message: "User not found",
      };
    }

    const clearedUserCartList = await User.findByIdAndUpdate(
      auth.userId,
      { $set: { wishList: [] } },
      { new: true }
    );

    if (!clearedUserCartList) {
      return {
        statusCode: 500,
        message:
          "something went wrong: user wishlist can't be cleared at the moment",
      };
    }
    return {
      statusCode: 200,
      message: "User wishlist cleared successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to clear user wishlist data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
