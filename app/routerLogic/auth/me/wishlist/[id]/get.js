import processUserData from "../../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../../models/user.js";

/**
 *
 * @param {import("../../../../../../lib/utils/withErrorHandling").RouteEvent&{params:{id:string}}} event
 * @returns {generalResponse & {data:WishlistItem}}
 */
export default async function get(event) {
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
    // 2. Get user data
    // 4. Find wishlist item
    const user = await User.findOne(
      {
        _id: event.auth?.userId,
        "wishList._id": id,
      },
      { "wishList.$": 1 }
    ).lean();

    // 5. Handle not found
    if (!user) {
      return {
        statusCode: 404,
        message: "Not found: wishlist item not found",
      };
    }

    // 6. Parse and validate wishlist data
    const WishlistItem = processUserData(user).wishList?.[0];
    if (!WishlistItem) {
      return {
        statusCode: 500,
        message: "Internal server error: Failed to parse Wishlist item data",
      };
    }

    // 7. Return success response
    return {
      statusCode: 200,
      message: "WishlistItem item found",
      data: WishlistItem,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch wishlist with id of ${id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
