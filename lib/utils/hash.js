import bcrypt from "bcrypt";
import env from "../constants/env.js";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS);  // recommended number of salt rounds

/**
 * Hash a password using bcrypt.
 * @param {string} toEncrypt Plain text password
 * @returns {string} The hash string
 */
export function encrypt(toEncrypt) {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(toEncrypt, salt);
}

/**
 * Verify a password against a hash.
 * @param {string} toVerify text password
 * @param {string} storedHash Hash string
 * @returns {boolean} true if match, false otherwise
 */
export function verifyEncrypted(toVerify, storedHash ) {
  return bcrypt.compareSync(toVerify, storedHash);
}

export default {
  encrypt,
  verifyEncrypted
}