import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import flattenToDotNotation from "../../../../../lib/utils/flatten-to-dot-notation.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../models/user.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{updates:any[]}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function patch(event) {
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
  } = objectErrorBoundary(event.body, ["updateData"]);

  if (hasError || !body || !Array.isArray(body.updateData)) {
    return {
      statusCode: 400,
      status: "bad",
      message: errorMessage,
      success: false,
    };
  }

  try {
    let updateQuery = {};
    let arrayFilters = [];

    // Build dynamic $set for each address update
    body.updateData.forEach((addr, index) => {
      if (!addr.id) return;

      const filterName = `elem${index}`;
      arrayFilters.push({ [`${filterName}._id`]: addr.id });

      // Flatten nested fields inside this address
      const flattened = flattenToDotNotation(addr);

      for (const [key, value] of Object.entries(flattened)) {
        if (key === "id") continue;
        updateQuery[`addresses.$[${filterName}].${key}`] = value;
      }
    });

    if (Object.keys(updateQuery).length === 0) {
      return {
        statusCode: 400,
        status: "bad",
        message: "No valid address updates provided.",
        success: false,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateQuery },
      { new: true, arrayFilters }
    ).select("-password -__v");

    if (!updatedUser) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found or address update failed",
        success: false,
      };
    }

    
    return {
      statusCode: 200,
      status: "good",
      message: "Addresses updated successfully",
      success: true,
      data: processUserData(updatedUser).addresses,
    };
  } catch (error) {
    throw new Error(
      `Failed to update addresses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
