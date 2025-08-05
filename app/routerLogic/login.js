/**
 * @typedef {Object} LoginBody
 * @property {string} email
 * @property {string} password
 */

import objectErrorBoundary from "../../lib/utils/objectErrorBoundary.js";

/**
 * @param {Omit<import("../../lib/utils/routeHandler").RouteEvent, 'body'> & { body: LoginBody }} config
 * @returns {Partial<generalResponse>}
 */
export async function login(config) {
  const { object, hasError, errorMessage } = objectErrorBoundary(
    config.body,
    ["email", "password"],
    {
      label: "Body",
    }
  );

  if (hasError) {
    return {
      statusCode: 404,
      message: errorMessage,
    };
  }

//   handle the login logic here

  return {
    message: "Login successful",
    data:object,
    statusCode: 200,
  };
}
