import processUserData from "../../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../../models/user.js";

/**
 *
 * @param {Omit<import("../../../../../../lib/utils/withErrorHandling.js").RouteEvent,'params'|'body'>&{params:{id:string},body:{data:{increment?:number, quantity?:number}}}} event
 * @returns {generalResponse & {data:WishlistItem}}
 */
export default async function patch(event) {
  // 1. Connect to MongoDB
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
  } = objectErrorBoundary(event.body, ["data"]);

  if (hasError || !body) {
    return {
      statusCode: 400,
      message: "Bad request: " + errorMessage,
      success: false,
    };
  }

  // 2. Validate input
  if (
    body.data.increment === undefined &&
    body.data.quantity === undefined
  ) {
    return {
      statusCode: 400,
      message: "Bad request: must provide either 'quantity' or 'increment'",
      success: false,
    };
  }

  if (body.data.quantity !== undefined && body.data.quantity < 1) {
    return {
      statusCode: 400,
      message: "Bad request: quantity must be at least 1",
      success: false,
    };
  }

  try {
    // 3. Build update query
    let updateQuery;

    if (body.data.increment !== undefined) {
      updateQuery = {
        $inc: { "cart.$.quantity": body.data.increment },
        $set: { "cart.$.updatedAt": new Date() },
      };
    } else {
      updateQuery = {
        $set: {
          "cart.$.quantity": body.data.quantity,
          "cart.$.updatedAt": new Date(),
        },
      };
    }

    // 4. Execute update
    const updatedUserCart = await User.findOneAndUpdate(
      {
        _id: event.auth?.userId,
        "cart.productId": id,
      },
      updateQuery,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUserCart) {
      return {
        statusCode: 404,
        message: "Not found: Cart item not found",
        success: false,
      };
    }

    // 5. Parse updated cart
    const updatedCart = processUserData(updatedUserCart).cart;
    if (!updatedCart || !Array.isArray(updatedCart)) {
      return {
        statusCode: 500,
        message: "Internal server error: Failed to parse updated cart data",
        success: false,
      };
    }

    // 6. Return success
    return {
      statusCode: 200,
      message: "Cart item updated successfully",
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    console.log(error);

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
