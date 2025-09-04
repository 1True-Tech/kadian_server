import useCache from "../../../../lib/utils/use-cache.js";
import connectDbInventory from "../../../../lib/utils/mongo/connect-db-inventory.js";
import Inventory from "../../../../models/inventory.js";
import parseInventoryItem from "../../../../lib/utils/parseInventoryItem.js";

/**
 * @param {Omit<import("../../../../lib/utils/withErrorHandling").RouteEvent, 'params'> & {params:{productId:string}}} event
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

  return await useCache(
    `inventory_${event.params.productId}`,
    /**
     * @returns {Promise<InventoryGetResponse>}
     */
    async () => {
      const inventoryItem = await Inventory.findOne({
        sanityProductId: event.params.productId,
      });

      if (!inventoryItem) {
        return {
          statusCode: 404,
          status: "bad",
          message: "Inventory data not found for product",
        };
      }

      return {
        status: "good",
        statusCode: 200,
        message: "Inventory data retrieved successfully",
        data: parseInventoryItem(inventoryItem),
      };
    },
    1 // 1 minute TTL since inventory is time-sensitive
  );
}
