import processUserData from "../../../../../../lib/data-processors/process-user-data.js";
import flattenToDotNotation from "../../../../../../lib/utils/flatten-to-dot-notation.js";
import connectDbUsers from "../../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../../models/user.js";

/**
 *
 * @param {Omit<import("../../../../../../lib/utils/withErrorHandling.js").RouteEvent,'params'|'body'>&{params:{id:string},body:{data:{limit:number}}}} event
 * @returns {generalResponse & {data:WishlistItem}}
 */
export default async function patch(event) {
  // Connect to MongoDB
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      statusCode: 500,
      message: "Failed to connect to database while fetching user.",
    };
  }
  const { id } = event.params;
  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(event.body, ["data", "data.limit"]);

  if (hasError || !body) {
    return {
      statusCode: 400,
      message: "Bad request: " + errorMessage,
      success: false,
    };
  }

  // Validate limit value
  if (typeof body.data.limit !== "number" || body.data.limit < 1) {
    return {
      statusCode: 400,
      message: "Bad request: Limit must be a positive number",
      success: false,
    };
  }
  try {
    // 5. Update cart item
    const dotFields = flattenToDotNotation(body.data, "cart.$");
    dotFields["cart.$.updatedAt"] = new Date();

    const updatedUserCart = await User.findOneAndUpdate(
      {
        _id: event.auth?.userId,
        "cart._id": id,
      },
      { $set: dotFields },
      {
        new: true,
        runValidators: true, // Ensure data validation
      }
    );

    // 6. Handle update failure
    if (!updatedUserCart) {
      return {
        statusCode: 404,
        message: "Not found: Cart item not found",
        success: false,
      };
    }

    // 7. Parse and validate updated cart
    const updatedCart = processUserData(updatedUserCart).cart;
    if (!updatedCart || !Array.isArray(updatedCart)) {
      return {
        statusCode: 500,
        message: "Internal server error: Failed to parse updated cart data",
        success: false,
      };
    }

    // 8. Return success response
    return {
      statusCode: 200,
      message: "Cart item updated successfully",
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    // Handle specific database errors
    console.log(error)
    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        return {
          statusCode: 400,
          message: "Bad request: " + error.message,
          success: false,
        };
      }
      if (error.name === "CastError") {
        return {
          statusCode: 400,
          message: "Bad request: Invalid ID format",
          success: false,
        };
      }
    }

    throw new Error(
      `Failed to update cart item: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
