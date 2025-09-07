import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../models/user.js";

/**
 * @param {Omit<import("../../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{updateData:WishlistItem[]|WishlistItem}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function myWishlistPatch(event) {
  const auth = event.auth;
  // Connect to MongoDB
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      statusCode: 500,
      message: "Failed to connect to database while fetching user.",
    };
  }
  try {
    const user = await User.findById(auth.userId).select("-password -__v");

    if (!user) {
      return {
        statusCode: 404,
        message: "User not found",
      };
    }

    const {
      object: body,
      hasError,
      errorMessage,
    } = objectErrorBoundary(event.body, ["updateData"], {
      checkers: {
        updateData: {
          action(val) {
            const hasError = Array.isArray(val)
              ? val.length === 0 ||
                val.some((item) => !item?.productId)
              : !val?.productId;
            return !hasError
          },
          message: "must not be an empty array, and must include a product id in the object"
        },
      },
    });

    if (hasError || !body) {
      return {
        statusCode: 400,
        message: "Update failed: " + errorMessage,
      };
    }
    // hZm6tMI3obk6ZBXKf82VBt

    const updateData = body.updateData; // updateData should be an array of items

    const updatedUserCart = await User.findByIdAndUpdate(
      auth.userId,
      {
        $addToSet: {
          wishList: {
            $each: Array.isArray(updateData) ? updateData : [updateData],
          },
        },
      },
      { new: true }
    );

    if (!updatedUserCart) {
      return {
        statusCode: 500,
        message:
          "something went wrong: user wishlist can't be updated at the moment",
      };
    }

    return {
      statusCode: 200,
      message: "User wishlist updated successfully",
      data: processUserData(updatedUserCart).wishList || [],
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user wishlist: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
