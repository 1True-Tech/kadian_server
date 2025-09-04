/// <reference path="../../../types/order.js" />
import Order from "../../../models/order.js";
import env from "../../../lib/constants/env.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import fetchCustomerInfo from "../../../lib/utils/fetch-customer-info.js";

/**
 * Create a new order
 * @param {Omit<import("../../../lib/utils/withErrorHandling").RouteEvent, 'body'> & {
 *   body: CreateOrderBody
 * }} event - The route event object
 * @returns {Promise<import('../../../types/api.js').generalResponse & {
 *   data?: OrderCreateResponse
 * }>}
 */
export async function post(event) {
  const auth = event.auth;
  if (!auth) {
    return {
      statusCode: 401,
      status: "bad",
      message: "Authentication required",
    };
  }
  const { userId, userRole } = auth;

  const isGuest = !userRole || userRole === "guest";

  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(
    event.body,
    [
      "items",
      "shippingAddress",
      ...(isGuest
        ? [
            "customerInfo",
            "customerInfo.name.first",
            "customerInfo.name.last",
            "customerInfo.name",
            "customerInfo.phone",
            "customerInfo.email",
          ]
        : []),
    ],
    { label: "Body" }
  );

  if (hasError || !body) {
    return {
      statusCode: 401,
      status: "bad",
      message: "Update failed: " + errorMessage,
    };
  }

  const { items, shippingAddress, customerInfo } = body;
  const customerInfoObj = await fetchCustomerInfo(
    isGuest,
    customerInfo,
    event.auth?.token || ""
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const orderObj = {
    userId: isGuest ? null : userId,
    guestId: isGuest ? userId : null,
    items,
    shippingAddress,
    totalAmount,
    status: "pending",
    customerInfo: customerInfoObj,
  };

  try {
    await connectDbOrders();
    const order = new Order(orderObj);

    // update stock for each item before saving the order
    for (const item of items) {
      const { sku, quantity, slug } = item;

      const inventoryStockUpdate = await fetch(
        `${env.baseUrl}/inventory/${slug}/${sku}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ delta: -quantity }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) => res.json());

      if (
        inventoryStockUpdate.status !== "good" ||
        inventoryStockUpdate.statusCode !== 200
      ) {
        throw new Error(
          `Failed to update stock for SKU ${sku}: ${inventoryStockUpdate.message}`
        );
      }
    }
    await order.save();
    return {
      status: "good",
      statusCode: 201,
      message: "Order created successfully.",
      data: {
        orderId: order._id.toString(),
        statusValue: order.status,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      status: "bad",
      message:
        "Failed to create order: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}
