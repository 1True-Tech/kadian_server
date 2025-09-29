import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../models/user.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{addressId:string}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function removeAddress(event) {
  const auth = event.auth;

  try {
    await connectDbUsers();
  } catch {
    return {
      statusCode: 500,
      status: "bad",
      message: "Failed to connect to database while fetching user.",
    };
  }

  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(event.body, ["addressId"]);

  if (hasError || !body || !body.addressId) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Invalid request: addressId is required",
      success: false,
    };
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $pull: { addresses: { _id: body.addressId } } },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found or address removal failed",
        success: false,
      };
    }

    return {
      statusCode: 200,
      status: "good",
      message: "Address removed successfully",
      success: true,
      data: processUserData(updatedUser).addresses,
    };
  } catch (error) {
    throw new Error(
      `Failed to remove address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
