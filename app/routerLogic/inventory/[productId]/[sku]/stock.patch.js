import connectDbInventory from "../../../../../lib/utils/mongo/connect-db-inventory.js";
import objectErrorBoundary from "../../../../../lib/utils/objectErrorBoundary.js";
import parseInventoryItem from "../../../../../lib/utils/parseInventoryItem.js";
import Inventory from "../../../../../models/inventory.js";

/**
 * @param {Omit<import("../../../../../lib/utils/withErrorHandling").RouteEvent, 'params'|'body'> & {params:{productId:string; sku:string}; body:{delta:number}}} event
 */
export default async function stockUpdate(event) {
  if (!event.params.productId) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Bad request: Missing product ID",
    };
  }

  const {
    errorMessage,
    hasError,
    object: body,
  } = objectErrorBoundary(event.body, ["delta"], {
    label: "Body",
    checkers: {
      delta: {
        /**
         *
         * @param {number} value
         * @returns
         */
        action(value) {
          return !isNaN(value);
        },
        message:
          "{{value}} is not a number, please specify a number either positive or negative",
      },
    },
  });

  if (!body || hasError) {
    return {
      statusCode: 400,

      status: "bad",
      message: errorMessage,
    };
  }

  const { delta } = body;
  // 2. Connect to MongoDB
  try {
    await connectDbInventory();
  } catch (error) {
    return {
      statusCode: 500,
      status: "bad",
      message: "Failed to connect to database.",
    };
  }

  // Find inventory item by product slug
  const inventoryItem = await Inventory.findOne({ sanityProductId: event.params.productId });
  if (!inventoryItem) {
    return {
      statusCode: 404,
      status: "bad",
      message: "Inventory item not found for the given product slug.",
    };
  }

  // Find the variant by SKU and update stock
  const variant = inventoryItem.variants.find((v) => v.sku === event.params.sku);
  if (!variant) {
    return {
      statusCode: 404,
      status: "bad",
      message: "Variant with the specified SKU not found.",
    };
  }
  const stockThreshold = variant.stockThreshold||0
  if (variant.currentStock === stockThreshold && delta < 0) {
    return {
      status: "bad",
      statusCode: 409,
      message: "Can't update stock, stock is empty.",
    };
  }

  const totalStock = variant.stock;
  if (variant.currentStock === totalStock && delta > 0) {
    return {
      status: "bad",
      statusCode: 409,
      message: "Can't update stock, maximum limit reached.",
    };
  }
  const calculatedStock = Math.max(
    Math.min(variant.currentStock + delta, totalStock),
    0
  );

  variant.currentStock = calculatedStock;

  try {
    await inventoryItem.save();
    return {
      status: "good",
      statusCode: 200,
      message: "Inventory updated successfully.",
      data: parseInventoryItem(inventoryItem),
    };
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: `Failed to update inventory: ${error.message}`,
    };
  }
}
