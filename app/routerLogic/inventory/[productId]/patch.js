import connectDbInventory from "../../../../lib/utils/mongo/connect-db-inventory.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import parseInventoryItem from "../../../../lib/utils/parseInventoryItem.js";
import Inventory from "../../../../models/inventory.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling").RouteEvent, 'params'|'body'> & {params:{productId:string};body:{sku:string;currentStock:number}}} event
 */
export default async function get(event) {
  if (!event.params.productId) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Bad request: Missing product ID",
    };
  }

  // Parse body for update data
  const {
    errorMessage,
    hasError,
    object: body,
  } = objectErrorBoundary(event.body, ["sku", "currentStock"], {
    label: "Body",
    checkers: {
      currentStock: {
        action(value) {
          return typeof value === "number" && value >= 0;
        },
        message: "must be a non-negative number having {{value}}",
      },
    },
  });
  if (hasError || !body) {
    return {
      statusCode: 400,
      message: "Bad request: Invalid request body." + errorMessage,
    };
  }
  const { sku, currentStock } = body;

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
  const inventoryItem = await Inventory.findOne({ slug: productId });
  if (!inventoryItem) {
    return {
      statusCode: 404,
      status: "bad",
      message: "Inventory item not found for the given product slug.",
    };
  }

  // Find the variant by SKU and update stock
  const variant = inventoryItem.variants.find((v) => v.sku === sku);
  if (!variant) {
    return {
      statusCode: 404,
      status: "bad",
      message: "Variant with the specified SKU not found.",
    };
  }

  variant.currentStock = currentStock;

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
