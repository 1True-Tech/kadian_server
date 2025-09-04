// ~/models/Inventory.js
import mongoose from "mongoose";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";
const { Schema } = mongoose;

// Subdocument to track each variant’s stock
const variantStockSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, min: 0 },
  stockThreshold: { type: Number, required: true, min: 0 },
  currentStock: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
});

// Inventory document ties to one Sanity product
const inventorySchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      description: "Label for the inventory item",
    },
    slug: {
      type: String,
      required: true,
      description: "Slug for the inventory item based on sanity product slug",
    },
    sanityProductId: {
      type: String,
      required: true,
      unique: true,
      description: "The Sanity product’s 'id' field (e.g. 'b4d393cb-e215-…')",
    },
    variants: {
      type: [variantStockSchema],
      validate: {
        /**
         *
         * @param {string | any[]} arr
         * @returns {boolean}
         */
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Inventory must have at least one variant",
      },
    },
  },
  { timestamps: false, id:true }
);

const inventoryConn = getDbConnection("inventory");
const Inventory =
  inventoryConn.models.Inventory ||
  inventoryConn.model("Inventory", inventorySchema);
export default Inventory;
