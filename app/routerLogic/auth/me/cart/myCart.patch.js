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
        statusCode: 401,
        status: "bad",
        message: "Update failed: " + errorMessage,
        success: false,
      };
    }

    const updateData = Array.isArray(body.updateData)
      ? body.updateData
      : [body.updateData];

    // Update logic
    updateData.forEach((newItem) => {
      const existingItem = user.cart.find(
        (item) =>
          item.productId === newItem.productId &&
          item.variantSku === newItem.variantSku
      );

      if (existingItem) {
        // Update quantity and timestamp
        existingItem.quantity += newItem.quantity;
        existingItem.updatedAt = new Date();
      } else {
        // Add new item
        user.cart.push({
          ...newItem,
          addedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    const updatedUser = await user.save();

    return {
      statusCode: 200,
      status: "good",
      message: "User cart updated successfully",
      success: true,
      data: processUserData(updatedUser).cart || [],
    };
  } catch (error) {
    throw new Error(
      `Failed to update user cart: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
