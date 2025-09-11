import { Schema } from "mongoose";
import address from "./address.js";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";

// --- Order Items ---
const orderItemSchema = new Schema(
  {
    sanityProductId: { type: String, required: true }, // Sanity product ID
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // price per unit in kobo or cents
  },
  { _id: false }
);

// --- Payment (aligned with PaymentMethod) ---
const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["card", "transfer", "delivery"],
      required: true,
    },
    reference: { type: String, required: false },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["initiated", "pending", "paid", "failed", "refunded"],
      default: "initiated",
    },
    proof: {
      secureUrl: { type: String, required: false }, // Cloudinary hosted URL
      publicId: { type: String, required: false }, // Cloudinary reference ID
    },
    paidAt: { type: Date },
  },
  { _id: false }
);

// --- Orders ---
const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    guestId: { type: String, required: false },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    payment: paymentSchema, // Proof of payment or selection
    shippingAddress: address,
    customerInfo: {
      name: {
        first: { type: String, required: true, minlength: 1, maxlength: 50 },
        last: { type: String, required: true, minlength: 1, maxlength: 50 },
      },
      email: { type: String, required: true },
      phone: { type: String, required: false },
    },
  },
  { timestamps: true }
);

const orderConn = getDbConnection("orders");
const Order = orderConn.models.Order || orderConn.model("Order", orderSchema);

export default Order;
