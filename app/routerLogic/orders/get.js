/// <reference path="../../../types/order.js" />
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import parseOrderItem from "../../../lib/utils/parseOrderItem.js";
import Order from "../../../models/order.js";

/**
 * Create a new order
 * @returns {generalResponse & OrderListResponse>}
 */
export async function get() {
  try {
    await connectDbOrders();
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: "Failed to connect to orders database",
    };
  }

  // 2. Fetch all orders
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return {
      status: "good",
      statusCode: 200,
      orders: parseOrderItem(orders),
      message: "Orders fetched successfully.",
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch orders: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
