/**
 * @typedef {Object} RegisterBody
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {{first:string; last:string}} name
 */

import connectDbUsers from "../../../lib/utils/mongo/connect-db-users.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import User from "../../../models/user.js";
import webhookService from "../../../lib/utils/webhookService.js";

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
    ["username", "password", "email", "name", "name.first", "name.last"],
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
    const existingUser = await User.findOne({ username: { $eq: body.username } });
    await User.syncIndexes();
    if (existingUser) {
      return {
        data: null,
        statusCode: 409,
        status: "bad",
        message: "Registration failed: Username already registered",
      };
    }

    // 4. Create new user
    const newUser = new User({
      username: body.username,
      password: body.password,
      email: body.email,
      name: {
        first: body.name?.first,
        last: body.name?.last,
      },
    });

    await newUser.save();

    const authTokens = newUser.generateAuthToken();
    
    // Trigger notifications for new user registration
    webhookService.processEvent('user_created', {
      userId: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      name: newUser.name
    }).catch(err => console.error('Failed to send registration notification:', err));

    return {
      data: authTokens,
      statusCode: 201,
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
