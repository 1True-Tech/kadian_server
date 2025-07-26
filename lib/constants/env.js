// Environment configuration
import dotenv from "dotenv";

// Environment variables
dotenv.config();

/**
 * @typedef {Object} EnvConfig
 * @property {string | undefined} PORT
 * @property {"development" | undefined} NODE_ENV
 */

/** @type {EnvConfig} */
const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
};

export default env;
