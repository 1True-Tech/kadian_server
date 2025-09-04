import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import Order from "../../../../models/order.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import parseOrderInfo from "../../../../lib/utils/parseOrderInfo.js";

/**
 * Update order details
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, 'params'|'body'> & {params:{id:string};body:{status:OrderStatus}}} event Parameters containing the order ID
 * @returns {Promise<Object>} Response object with updated order details
 */
export async function updateOrder(event) {
  // 1. Validate params
  const { object: validParams, errorMessage: paramsError, hasError: hasParamsError } = 
    objectErrorBoundary(event.params, ["id"], {
      label: "Path parameter",
    });

  if (hasParamsError || !validParams) {
    return {
      status: "bad",
      statusCode: 400,
      message: "Invalid order ID: " + paramsError,
    };
  }

  // 2. Validate body
  const { object: validBody, errorMessage: bodyError, hasError: hasBodyError } = 
    objectErrorBoundary(event.body, ["status"], {
      label: "Body",
      checkers: {
        status: {
          action(value) {
            return [
              "pending",
              "paid",
              "shipped",
              "completed",
              "cancelled",
            ].includes(value);
          },
          message: "must be one of pending|paid|shipped|completed|cancelled having {{value}}",
        },
      },
    });

  if (hasBodyError || !validBody) {
    return {
      status: "bad",
      statusCode: 400,
      message: "Invalid body: " + bodyError,
    };
  }

  const updatableFields = {
    status: validBody.status,
  };

  try {
    // 3. Connect and apply update
    await connectDbOrders();
    const updated = await Order.findByIdAndUpdate(
      validParams.id,
      { $set: updatableFields },
      { new: true, runValidators: true }
    );

    // 4. Not found?
    if (!updated) {
      return {
        status: "bad",
        statusCode: 404,
        message: "Order not found",
      };
    }

    // 5. Return the updated order info
    return {
      status: "good",
      statusCode: 200,
      order: parseOrderInfo(updated),
      message: "Order updated successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to update order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default updateOrder;
