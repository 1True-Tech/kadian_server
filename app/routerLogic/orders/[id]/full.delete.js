import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import Order from "../../../../models/order.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import env from "../../../../lib/constants/env.js";

/**
 * Permanently deletes an order and updates inventory if needed
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, 'params'> & {params:{id:string}}} event Parameters containing the order ID
 * @returns {Promise<Object>} Response object with status and message
 */
export async function permanentlyDeleteOrder(event) {
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

  try {
    // 2. Connect to database
    await connectDbOrders();

    // 3. Try to find the order
    const order = await Order.findById(params.id);

    // 4. Not found?
    if (!order) {
      return {
        status: "bad",
        statusCode: 404,
        message: "Order not found",
      };
    }

    // 5. Check if order is within 4 days
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

    // 6. Return items to inventory if order wasn't already cancelled
    try {
      if (order.status !== "cancelled") {
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

    // 7. Delete the order
    await order.deleteOne();

    // 8. Return success
    return {
      status: "good",
      statusCode: 200,
      message: "Order deleted successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to delete order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default permanentlyDeleteOrder;
