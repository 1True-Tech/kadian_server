import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../models/user.js";

/**
 * @param {Omit<import("../../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{updateData:CartItem[]|CartItem}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function myCartPatch(event) {
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
    const user = await User.findById(auth.userId).select("-password -__v");

    if (!user) {
      return {
        connectionActivity: isOnline,
        statusCode: 404,
        status: "bad",
        message: "User not found",
        success: false,
      };
    }

    const {
      object: body,
      hasError,
      errorMessage,
    } = objectErrorBoundary(event.body, ["updateData"]);

    if (hasError || !body) {
      return {
        connectionActivity: isOnline,
        statusCode: 401,
        status: "bad",
        message: "Update failed: " + errorMessage,
        success: false,
      };
    }

    const updateData = body.updateData; // updateData should be an array of items

    const updatedUserCart = await User.findByIdAndUpdate(
      auth.userId,
      {
        $addToSet: {
          cart: {
            $each: Array.isArray(updateData) ? updateData : [updateData],
          },
        },
      },
      { new: true }
    );

    if (!updatedUserCart) {
      return {
        connectionActivity: isOnline,
        statusCode: 500,
        status: "bad",
        message: "something went wrong: user can't be updated at the moment",
        success: false,
      };
    }

    return {
      connectionActivity: isOnline,
      statusCode: 200,
      status: "good",
      message: "User data updated successfully",
      success: true,
      data: processUserData(updatedUserCart).cart || [],
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user cart data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
