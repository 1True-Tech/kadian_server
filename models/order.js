import { Schema } from "mongoose";
import address from "./address.js";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";

const orderItemSchema = new Schema({
  sanityProductId: { type: String, required: true }, // Sanity product ID
  variantSku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // price per unit in kobo or cents
});

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      required: false,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    shippingAddress: address,
    customerInfo: {
      name: {
        first: { type: String, required: true, minlength: 1, maxlength: 50 },
        last: { type: String, required: true, minlength: 1, maxlength: 50 },
      },
      email: { type: String, required: true },
      phone: { type: String, required: false }
    },
  },
  { timestamps: true }
);

const orderConn = getDbConnection("orders");
const Order = orderConn.models.Order || orderConn.model("Order", orderSchema);

export default Order;