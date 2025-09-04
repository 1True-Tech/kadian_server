import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import Order from "../../../../models/order.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import env from "../../../../lib/constants/env.js";

/**
 * Deletes an order by ID and updates inventory
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, 'params'> & {params:{id:string}}} event Parameters containing the order ID
 * @returns {Promise<Object>} Response object with status and message
 */
export async function deleteOrder(event) {
  // 1. Validate params
  const { object:params, errorMessage, hasError } = objectErrorBoundary(event.params, ["id"], {
    label: "Parameters",
  });

  if (hasError || !object) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Failed to delete order: " + errorMessage,
    };
  }

  // 2. Connect to database
  try {
    await connectDbOrders();
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: "Failed to connect to orders database",
    };
  }

  // 3. Try to find the order
  const order = await Order.findById(params.id);

  if (!order) {
    return {
      status: "bad",
      statusCode: 404,
      message: "Order not found",
    };
  }

  // 4. Check if order is within 4 days
  const now = new Date();
  const createdAt = new Date(order.createdAt);
  const diffInMs = now.getTime() - createdAt.getTime();
  const maxAgeInMs = 4 * 24 * 60 * 60 * 1000; // 4 days in milliseconds

  if (diffInMs > maxAgeInMs) {
    return {
      status: "bad",
      statusCode: 403,
      message: "Order can no longer be deleted (older than 4 days)",
    };
  }

  // 5. Return items to inventory
  try {
    for (const item of order.items) {
      const { variantSku, quantity, sanityProductId } = item;

      const response = await fetch(
        `${env.baseUrl}/inventory/${sanityProductId}/${variantSku}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ delta: +quantity }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const inventoryStockUpdate = await response.json();

      if (
        inventoryStockUpdate.status !== "good" ||
        inventoryStockUpdate.statusCode !== 200
      ) {
        throw {
          statusCode: inventoryStockUpdate.statusCode,
          message: `Failed to update stock for SKU ${variantSku}: ${inventoryStockUpdate.message}`,
        };
      }
    }
  } catch (error) {
    return {
      status: "bad",
      statusCode: error.statusCode || 500,
      message: `Failed to return items to inventory: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  // 6. Mark order as cancelled instead of deleting
  order.status = "cancelled";
  await order.save();

  // 7. Return success
  return {
    status: "good",
    statusCode: 200,
    message: "Order cancelled successfully",
  };
}

export default deleteOrder;
