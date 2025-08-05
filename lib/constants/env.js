// Environment configuration
import dotenv from "dotenv";

// Environment variables
dotenv.config();

/**
 * @typedef {Object} EnvConfig
 * @property {number} PORT
 * @property {"development" | undefined} NODE_ENV
 * @property {"string" | undefined} JWT_ACCESS_SECRET
 * @property {"string" | undefined} JWT_REFRESH_SECRET
 * @property {"string" | undefined} MONGODB_URI
 */

/** @type {EnvConfig} */
const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT:
    Number.isFinite(+process.env.PORT) && +process.env.PORT > 0
      ? +process.env.PORT
      : 5000,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
};

export default env;
