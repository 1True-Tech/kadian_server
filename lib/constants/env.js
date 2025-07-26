// Environment configuration
import dotenv from "dotenv";

// Environment variables
dotenv.config();

/**
 * @typedef {Object} EnvConfig
 * @property {number} PORT
 * @property {"development" | undefined} NODE_ENV
 */

/** @type {EnvConfig} */
const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number.isFinite(+process.env.PORT) && +process.env.PORT > 0 ? +process.env.PORT : 5000,
};

export default env;
