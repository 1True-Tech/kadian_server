/**
 * @typedef {Object} RegisterBody
 * @property {string} email
 * @property {string} password
 * @property {{first:string; last:string}} name
 */

import connectDbUsers from "../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import User from "../../../models/user.js";

/**
 * @param {Omit<import("../../../lib/utils/routeHandler.js").RouteEvent, 'body'> & { body: RegisterBody }} event
 * @returns {Partial<generalResponse>}
 */
export default async function register(event) {
  // 1. Validate request body
  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(
    event.body,
    ["email", "password", "name", "name.first", "name.last"],
    {
      label: "Body",
    }
  );

  if (hasError || !body) {
    return {
      data: null,
      statusCode: 400,
      status: "bad",
      message: "User registration failed: " + errorMessage,
    };
  }

  // 2. Connect to MongoDB
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      data: null,
      statusCode: 500,
      status: "bad",
      message: "User registration failed: Database connection error",
    };
  }

  // 3. Check for existing user
  try {
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return {
        data: null,
        statusCode: 409,
        status: "bad",
        message: "Registration failed: Email already registered",
      };
    }

    // 4. Create new user
    const newUser = new User({
      email: body.email,
      password: body.password,
      name: {
        first: body.name?.first,
        last: body.name?.last,
      },
    });

    await newUser.save();

    const authTokens = newUser.generateAuthToken();

    return {
      data: authTokens,

      statusCode: 200,
      status: "good",
      message: "Registration successful",
    };
  } catch (error) {
    throw new Error(
      `Registration failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
