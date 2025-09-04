import { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import address from "./address.js";
import { randomBytes } from "crypto";

import env from "../lib/constants/env.js";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";
import hash from "../lib/utils/hash.js";

const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = env;
const TOKEN_EXPIRY = "7d";

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^[\w!#$%&'*+/=?`{|}~^.-]+@[\w.-]+\.[a-zA-Z]{2,}$/, // this is to validate if the email is following standard email format
      "Invalid email format",
    ],
    minlength: 5,
  },
  password: {
    type: String,
    required: true,
    match: [
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "unsecure password, must have at least, an uppercase letter, a number and a symbol",
    ],
    minlength: 8, // standard secure password is commonly 8,
  },
  name: {
    first: { type: String, required: true, minlength: 1, maxlength: 50 },
    last: { type: String, required: true, minlength: 1, maxlength: 50 },
  },
  phone: {
    type: String,
    match: [/^\+\d{1,15}$/, "Phone must be in E.164 format"], // Optional, E.164 format
    required: false,
  },
  addresses: [address], // embed addresses (one-to-few):contentReference[oaicite:13]{index=13}
  cart: [
    {
      productId: { type: String, unique: true }, // Sanity product ID
      addedAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      quantity: { type: Number, default: 1 },
      variantSku: { type: String, required: true},
      price: { type: Number, default: 0 },
    },
  ],

  wishList: [
    {
      productId: { type: String, unique: true }
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  resetPasswordTokenHash: String,
  resetPasswordExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Number,
});

// Pre-save: hash modified password
UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    if (!this.password) throw new Error("password is not available");
    this.setPassword(this.password);
  }
  next();
});

// Instance Methods
// Hash & set password: use this to handle the hashing logic
UserSchema.methods.setPassword = function (plain) {
  // run your encrypting logic here
  this.password = hash.encrypt(plain);
};

UserSchema.methods.comparePassword = function (candidate) {
  // run your comparison logic here (candidate is the normal password, and this.password is the hashed password)
  return hash.verifyEncrypted(candidate, this.password);
};

UserSchema.methods.generateAuthToken = function () {
  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET)
    throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET not set");
  const access = jwt.sign(
    { userId: this._id.toString() }, // you can add other payload items to this as well, maybe role or so
    JWT_ACCESS_SECRET,
    {
      expiresIn: TOKEN_EXPIRY,
    }
  );
  const refresh = jwt.sign(
    { userId: this._id.toString() },
    JWT_REFRESH_SECRET,
    {
      expiresIn: TOKEN_EXPIRY,
    }
  );
  return {
    access,
    refresh,
  };
};

UserSchema.methods.generateResetToken = function () {
  const token = randomBytes(20).toString("hex");
  this.resetPasswordTokenHash = hash.encrypt(token);
  this.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1 hour
  return token;
};


// 4. Verify reset token
UserSchema.methods.verifyResetToken = function (token) {
  if (
    !this.resetPasswordExpires ||
    Date.now() > this.resetPasswordExpires.getTime()
  ) {
    return false;
  }
  return hash.verifyEncrypted(token, this.resetPasswordTokenHash || "");
};

// 5. Increment failed login
UserSchema.methods.incrementFailedLogin = async function () {
  if (this.isLocked) return;
  this.loginAttempts ? this.loginAttempts++ : 0;
  if ((this.loginAttempts || 0) >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60_000; // 2 hours
  }
  await this.save();
};

// Virtual: isLocked
UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && Date.now() < this.lockUntil);
});

// 7. Role check
UserSchema.methods.hasRole = function (_, ...roles) {
  return roles.includes(this.role);
};

UserSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
  },
});

const userConn = getDbConnection("users");

const User = userConn.models.User || userConn.model("User", UserSchema);

export default User;
