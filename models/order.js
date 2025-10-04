import { Schema } from "mongoose";
import address from "./address.js";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";

// --- Order Items ---
const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true }, // Sanity product ID
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // price per unit in kobo or cents
  },
  { _id: false }
);

// --- Payment Schema ---
const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["card", "transfer", "delivery"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "transfer", "delivery"],
      required: false,
    },
    reference: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["initiated", "pending", "paid", "failed", "refunded"],
      default: "initiated",
    },
    proof: {
      imageId: { type: Schema.Types.ObjectId, ref: 'Image', required: false }, // MongoDB Image reference
      filename: { type: String, required: false }
    },
    // Provider-specific IDs
    providerOrderId: { type: String, required: false },
    providerPaymentId: { type: String, required: false },
    providerCheckoutSessionId: { type: String, required: false },
    providerClientSecret: { type: String, required: false },
    // Payment method details (safe fields only)
    paymentMethod: {
      brand: { type: String, required: false },
      last4: { type: String, required: false },
      expMonth: { type: Number, required: false },
      expYear: { type: Number, required: false }
    },
    // Payer information
    payer: {
      email: { type: String, required: false },
      id: { type: String, required: false }
    },
    receiptUrl: { type: String, required: false },
    paidAt: { type: Date },
    // Idempotency and webhook handling
    idempotencyKey: { type: String, required: false },
    webhookProcessedAt: { type: Date },
    attempts: { type: Number, default: 0 },
    // Refund tracking
    refunds: [{
      id: { type: String, required: true },
      amount: { type: Number, required: true },
      status: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
  },
  { _id: false }
);

// Payment history for audit trail
const paymentHistorySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true },
    provider: { type: String, required: false },
    amount: { type: Number, required: false },
    metadata: { type: Schema.Types.Mixed },
    webhookEvent: { type: String, required: false },
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
      enum: ["pending", "placed", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    payment: paymentSchema, // Proof of payment or selection
    paymentHistory: [paymentHistorySchema], // Audit trail of payment status changes
    rawWebhookEvents: [{ type: Schema.Types.Mixed }], // Store raw webhook events for debugging
    shippingAddress: address,
    idempotencyKey: { type: String, required: false },
    customerInfo: {
      name: {
        first: { type: String, required: true, minlength: 1, maxlength: 50 },
        last: { type: String, required: true, minlength: 1, maxlength: 50 },
      },
      email: { type: String, required: true },
      phone: { type: String, required: false },
    },
    totalAmount: { type: Number, required: true }, // Total amount in smallest currency unit (kobo/cents)
    currency: { type: String, default: "NGN" }, // ISO currency code
  },
  { timestamps: true }
);

const orderConn = getDbConnection("orders");
const Order = orderConn.models.Order || orderConn.model("Order", orderSchema);

export default Order;
