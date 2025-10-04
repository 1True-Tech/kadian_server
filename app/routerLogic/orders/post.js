/// <reference path="../../../types/order.js" />
import fetchCustomerInfo from "../../../lib/utils/fetch-customer-info.js";
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import Order from "../../../models/order.js";
import User from "../../../models/user.js";
import webhookService from "../../../lib/utils/webhookService.js";
import { randomUUID } from "crypto";

/**
 * Remove ordered items from user's cart
 */
async function removeFromCart(userId, orderedItems) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.cart) return;
    user.cart = user.cart.filter(
      (cartItem) =>
        !orderedItems.some(
          (orderItem) =>
            orderItem.productId === cartItem.productId &&
            orderItem.variantSku === cartItem.variantSku
        )
    );
    await user.save();
  } catch (err) {
    console.error("Error removing items from cart:", err);
  }
}

export async function post(event) {
  const baseUrl = event.req.protocol + "://" + event.req.get("host");
  const auth = event.auth;
  const { userId, userRole } = auth || {};
  const isGuest = !auth || !userRole || userRole === "guest";

  const { object: body, hasError, errorMessage } = objectErrorBoundary(
    event.body,
    [
      "items",
      "idempotencyKey",
      ...(isGuest
        ? [
            "customerInfo",
            "customerInfo.name.first",
            "customerInfo.name.last",
            "customerInfo.phone",
            "customerInfo.email",
          ]
        : []),
    ],
    { label: "Body" }
  );

  if (hasError || !body) {
    return { statusCode: 400, status: "bad", message: "Validation failed: " + errorMessage };
  }

  const { items, shippingAddress, customerInfo } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, status: "bad", message: "Order must contain at least one item" };
  }

  for (const item of items) {
    if (!item.productId || !item.variantSku || !item.quantity || !item.price) {
      return { statusCode: 400, status: "bad", message: "Each item must have productId, variantSku, quantity, and price" };
    }
  }

  const customerInfoObj = await fetchCustomerInfo(isGuest, customerInfo, userId);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderObj = {
    userId: isGuest ? null : userId,
    guestId: isGuest ? (userId || randomUUID()) : null,
    items: items.map((item) => ({
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: item.quantity,
      price: item.price,
    })),
    idempotencyKey: body.idempotencyKey || null,
    shippingAddress: shippingAddress || null,
    status: "pending",
    customerInfo: customerInfoObj,
    payment: null,
    totalAmount,
    currency: "NGN",
  };

  try {
    await connectDbOrders();
    const order = new Order(orderObj);

    for (const item of items) {
      const { variantSku, quantity, productId } = item;
      const inventoryStockUpdate = await fetch(
        `${baseUrl}/inventory/${productId}/${variantSku}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ delta: -quantity }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((res) => res.json());

      if (inventoryStockUpdate.status !== "good" || inventoryStockUpdate.statusCode !== 200) {
        throw new Error(`Failed to update stock for SKU ${variantSku}: ${inventoryStockUpdate.message}`);
      }
    }

    await order.save();
    if (!isGuest) await removeFromCart(userId, items);

    webhookService.processEvent("order_created", {
      orderId: order._id.toString(),
      userId: order.userId,
      customerInfo: order.customerInfo,
      items: order.items,
      total: order.totalAmount,
      status: order.status,
    }).catch((err) => console.error("Failed to send order notification:", err));

    return {
      status: "good",
      statusCode: 201,
      message: "Order created successfully. Awaiting payment.",
      data: { orderId: order._id.toString(), statusValue: order.status },
    };
  } catch (err) {
    return {
      statusCode: 500,
      status: "bad",
      message: "Failed to create order: " + (err instanceof Error ? err.message : String(err)),
    };
  }
}
