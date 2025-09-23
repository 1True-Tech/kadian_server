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
 * @property {"string" | undefined} SALT_ROUNDS
 * @property {"string" | undefined} ALLOWEDDOMAIN
 * @property {"string" | undefined} CLOUDINARY_SECRET
 * @property {"string" | undefined} CLOUDINARY_KEY
 * @property {"string" | undefined} CLOUDINARY_NAME
 * @property {"string" | undefined} CLOUDINARY_URL
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
  SALT_ROUNDS: process.env.SALT_ROUNDS,
  ALLOWEDDOMAIN: process.env.ALLOWEDDOMAIN,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || "usd",
  // PayPal configuration
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE: process.env.PAYPAL_MODE || "sandbox"
};

export default env;
