import connectDbInventory from "../../../lib/utils/mongo/connect-db-inventory.js";
import Inventory from "../../../models/inventory.js";
export default async function get() {
  // 1. Connect to MongoDB
  try {
    await connectDbInventory();
  } catch (error) {
    return {
      statusCode: 500,

      status: "bad",
      message: "Failed to connect to database.",
    };
  }

  // 2. return data
  const inventoryItem = await Inventory.find({}).lean();

  return {
    message: "Inventory data fetched",
    statusCode: 200,
    data: inventoryItem,
  };
}
