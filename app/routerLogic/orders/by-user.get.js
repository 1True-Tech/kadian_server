/// <reference path="../../../types/order.js" />
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import parseOrderItem from "../../../lib/utils/parseOrderItem.js";
import Order from "../../../models/order.js";

/**
 * @param {import("../../../lib/utils/withErrorHandling").RouteEvent&{query:{userId:string}}} event - The route event object
 * @returns {Promise<import('../../../types/api.js').generalResponse & OrderListResponse>}
 */
export async function getByUser(event) {
  const query = event.query;
  const {
    object: queries,
    errorMessage,
    hasError,
  } = objectErrorBoundary(query, ["userId"], {
    label: "Query parameters",
    isQuery: true,
  });

  if (hasError || !queries) {
    return {
      statusCode: 400,
      message: "Failed to get orders: " + errorMessage,
    };
  }
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
    // 3. Fetch user's orders
    const orders = await Order.find({ userId: queries.userId }).sort({
      createdAt: -1,
    });

    // 4. Return success response
    return {
      status: "good",
      statusCode: 200,
      orders: parseOrderItem(orders),
      message: "Orders fetched successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user's orders: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
