import connectDbInventory from "../../../../../lib/utils/mongo/connect-db-inventory.js";
import Inventory from "../../../../../models/inventory.js";

/**
 * @param {Omit<import("../../../../../lib/utils/withErrorHandling").RouteEvent, 'params'> & {params:{productId:string; sku:string}}} event
 */
export default async function get(event) {
  if (!event.params.productId) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Bad request: Missing product ID",
    };
  }

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
      message: "Inventory item not found for the given product slug.",
    };
  }

  // Find the variant by SKU and update stock
  const variant = inventoryItem.variants.find((v) => v.sku === event.params.sku);
  if (!variant) {
    return {
      statusCode: 404,
      message: "Variant with the specified SKU not found.",
    };
  }

  try {
    return {
      status: "good",
      statusCode: 200,
      message: "Inventory item fetched successfully.",
      data: variant,
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: `Failed to fetch inventory: ${error.message}`,
    };
  }
}
