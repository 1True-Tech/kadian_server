/// <reference path="../../types/user.js" />

import jwt from "jsonwebtoken";

/**
 * @typedef {Object} TokenData
 * @property {string} userId - The ID of the user
 * @property {UserRole} role - The ID of the user
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

/**
 * @typedef {Object} InvalidTokenResult
 * @property {"no token" | "invalid token"} type - The type of invalid result
 * @property {null} tokenValue - Always null for invalid results
 */

/**
 * @typedef {Object} ValidTokenResult
 * @property {"valid token"} type - Indicates a valid token
 * @property {TokenData} tokenValue - The decoded token data
 */

/**
 * Verifies a JWT token against a secret
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key used to verify the token
 * @returns {InvalidTokenResult | ValidTokenResult} The verification result
 */
export default function verifyUserTokens(token, secret) {
  if (token === "") {
    return {
      type: "no token",
      tokenValue: null,
    };
  }
  const verify = jwt.verify(token, secret || "");
  if (!verify) {
    return {
      type: "invalid token",
      tokenValue: null,
    };
  }

  return {
    type: "valid token",
    tokenValue: verify,
  };
}
