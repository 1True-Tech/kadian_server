/**
 * @typedef {Object} LoginBody
 * @property {string} username
 * @property {string} password
 */

import connectDbUsers from "../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import User from "../../../models/user.js";

/**
 * @param {Omit<import("../../../lib/utils/routeHandler.js").RouteEvent, 'body'> & { body: LoginBody }} event
 * @returns {Partial<generalResponse>}
 */
export default async function login(event) {
  // 1: validate the request body
  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(event.body, ["username", "password"], {
    label: "Body",
  });

  if (hasError || !body) {
    return {
      data: null,
      statusCode: 400,
      message: "Login failed: " + errorMessage,
    };
  }

  // 2. Connect to database
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      data: null,
      statusCode: 500,
      message: "Login failed: Database connection error",
    };
  }

  // 3. Find and validate user

  try {
    const existingUser = await User.findOne({ username: { $eq: body.username } }).select(
      "+password"
    );
    if (!existingUser) {
      return {
        data: null,
        statusCode: 401,
        message: "Invalid username",
      };
    }

    const passwordIsCorrect = existingUser.comparePassword(body.password);
    if (!passwordIsCorrect) {
      return {
        data: null,
        statusCode: 401,
        message: "Invalid password",
      };
    }

    const authTokens = existingUser.generateAuthToken();

    return {
      statusCode: 200,
      message: "Sign in successful.",
      data: authTokens,
    };
  } catch (error) {
    return {
      message: `Login failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      data: null,
      statusCode: 500,
    };
  }
}
