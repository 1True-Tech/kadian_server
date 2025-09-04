import processUserData from "../../../../lib/data-processors/process-user-data.js";
import flattenToDotNotation from "../../../../lib/utils/flatten-to-dot-notation.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../models/user.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{updateData:any}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function myInfoPatch(event) {
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

  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(event.body, ["updateData"]);

  if (hasError || !body) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Update failed: " + errorMessage,
      success: false,
    };
  }
  try {
    // 3. Update user profile
    const updateData = flattenToDotNotation(body.updateData);
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    // 4. Handle update failure
    if (!updatedUser) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found or update failed",
        success: false,
      };
    }

    // 5. Return success response
    return {
      statusCode: 200,
      status: "good",
      message: "User profile updated successfully",
      success: true,
      data: processUserData(updatedUser),
    };
  } catch (error) {
    throw new Error(
      `Failed to update user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
