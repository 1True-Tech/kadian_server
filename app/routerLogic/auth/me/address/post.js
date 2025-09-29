import processUserData from "../../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import User from "../../../../../models/user.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, "body"> & {body:{updateData:any}}} event
 * @returns {Partial<generalResponse>}
 */
export default async function post(event) {
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

  const { object: body, hasError, errorMessage } = objectErrorBoundary(event.body, ["updateData"], {
    checkers: {
      updateData: {
        action(val) {
          return Array.isArray(val);
        },
        message: "updateData must be an array"
      }
    }
  });

  if (hasError || !body || !body.updateData) {
    return {
      statusCode: 400,
      status: "bad",
      message: errorMessage || "Invalid request data",
      success: false,
    };
  }

  const allowedFields = ["line1", "line2", "city", "state", "postal", "country"];
  const requiredFields = ["line1", "city", "state", "postal", "country"];

  const cleanAddresses = [];

  for (const addr of body.updateData) {
    const newAddress = {};

    for (const key of allowedFields) {
      if (addr[key] !== undefined) {
        newAddress[key] = addr[key];
      }
    }

    // Check required fields for this address
    const missingFields = requiredFields.filter(f => !newAddress[f]);
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        status: "bad",
        message: `Address missing required fields: ${missingFields.join(", ")}`,
        success: false,
      };
    }

    cleanAddresses.push(newAddress);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $push: { addresses: { $each: cleanAddresses } } },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found or addresses could not be added",
        success: false,
      };
    }

    return {
      statusCode: 200,
      status: "good",
      message: "Addresses added successfully",
      success: true,
      data: processUserData(updatedUser).addresses,
    };
  } catch (error) {
    throw new Error(
      `Failed to add addresses: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
