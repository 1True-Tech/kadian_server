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
  // Security: Users can only access their own orders
  // Admin users can access any user's orders by providing userId in query
  const isAdmin = event.auth?.userRole === "admin";
  const requestedUserId = event.query?.userId;
  const authenticatedUserId = event.auth?.userId;

  let targetUserId;
  
  if (isAdmin && requestedUserId) {
    // Admin can query any user's orders
    targetUserId = requestedUserId;
  } else {
    // Regular users can only access their own orders
    targetUserId = authenticatedUserId;
  }

  if (!targetUserId) {
    return {
      statusCode: 400,
      message: "Failed to get orders: User ID not available",
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
    const orders = await Order.find({ userId: targetUserId }).sort({
      createdAt: -1,
    });

    // 4. Return success response
    return {
      status: "good",
      statusCode: 200,
      data: parseOrderItem(orders),
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
