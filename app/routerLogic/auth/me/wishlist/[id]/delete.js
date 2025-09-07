import connectDbUsers from "../../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../../models/user.js";

/**
 *
 * @param {import("../../../../../../lib/utils/withErrorHandling.js").RouteEvent&{params:{id:string}}} event
 * @returns {generalResponse & {data:WishlistItem}}
 */
export default async function deleteItem(event) {
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
  const { id } = event.params;
  try {
    // 4. Verify item exists before deletion
    const userWithItem = await User.findOne({
      _id: event.auth?.userId,
      "wishList.productId": id,
    });

    if (!userWithItem) {
      return {
        statusCode: 404,
        message: "Not found: wishlist item does not exist",
        success: false,
      };
    }

    // 5. Remove item from wishlist
    const updatedUser = await User.findByIdAndUpdate(
      event.auth?.userId,
      { $pull: { wishList: { productId: id } } },
      { new: true, runValidators: true }
    );

    // 6. Handle deletion failure
    if (!updatedUser) {
      return {
        statusCode: 500,
        message: "Internal server error: Failed to update user data",
        success: false,
      };
    }

    // 7. Return success response
    return {
      statusCode: 200,
      message: "Wishlist item removed successfully",
      success: true,
    };
  } catch (error) {
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.name === "CastError") {
        return {
          statusCode: 400,
          message: "Bad request: Invalid ID format",
          success: false,
        };
      }
      if (error.name === "ValidationError") {
        return {
          statusCode: 400,
          message: "Bad request: " + error.message,
          success: false,
        };
      }
    }

    throw new Error(
      `Failed to delete wishlist item: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
