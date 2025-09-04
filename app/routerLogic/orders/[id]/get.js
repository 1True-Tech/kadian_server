import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import Order from "../../../../models/order.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import parseOrderInfo from "../../../../lib/utils/parseOrderInfo.js";

/**
 * Get order details by ID
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, 'params'> & {params:{id:string}}} event Parameters containing the order ID
 * @returns {Promise<generalResponse&{order:OrdersResponseDetails}>} Response object with order details
 */
export async function getOrder(event) {
  // 1. Validate params
  const { object:params, errorMessage, hasError } = objectErrorBoundary(event.params, ["id"], {
      label: "Parameters",
    });

  if (hasError || !object) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Failed to get order: " + errorMessage,
    };
  }

  try {
    // 2. Connect to database
    await connectDbOrders();

    // 3. Fetch order
    const order = await Order.findById(params.id).sort({ createdAt: -1 });

    // 4. Handle order not found
    if (!order) {
      return {
        status: "bad",
        statusCode: 404,
        message: "Order not found",
      };
    }

    // 5. Return success response
    return {
      status: "good",
      statusCode: 200,
      order: parseOrderInfo(order),
      message: "Order fetched successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default getOrder;
