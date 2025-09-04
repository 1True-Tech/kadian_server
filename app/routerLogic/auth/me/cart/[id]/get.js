import processUserData from "../../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../../lib/utils/mongo/connect-db-users.js";
import User from "../../../../../../models/user.js";

/**
 *
 * @param {import("../../../../../../lib/utils/withErrorHandling.js").RouteEvent&{params:{id:string}}} event
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
    // 4. Find cart item
    const user = await User.findOne(
      {
        _id: event.auth?.userId,
        "cart._id": id,
      },
      { "cart.$": 1 }
    ).lean();

    // 5. Handle not found
    if (!user) {
      return {
        statusCode: 404,
        message: "Not found: cart item not found",
      };
    }

    // 6. Parse and validate cart data
    const WishlistItem = processUserData(user).cart?.[0];
    if (!WishlistItem) {
      return {
        statusCode: 500,
        message: "Internal server error: Failed to parse cart item data",
      };
    }

    // 7. Return success response
    return {
      statusCode: 200,
      message: "cart item item found",
      data: WishlistItem,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch cart item with id of ${id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
