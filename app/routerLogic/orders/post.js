/// <reference path="../../../types/order.js" />
import fetchCustomerInfo from "../../../lib/utils/fetch-customer-info.js";
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import Order from "../../../models/order.js";
import Image from "../../../models/image.js";
import User from "../../../models/user.js";
import getDbConnection from "../../../lib/utils/mongo/get-db-connection.js";
import env from "../../../lib/constants/env.js";

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

/**
 * POST /orders - Create a new order
 */
export async function post(event) {
  const baseUrl = event.req.protocol + "://" + event.req.get("host");
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
      ...(event.body.payment.method === "transfer" ||
      event.body.payment.method === "delivery"
        ? ["shippingAddress"]
        : []),
      "payment.method",
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
    return {
      statusCode: 400,
      status: "bad",
      message: "Validation failed: " + errorMessage,
    };
  }

  const { items, shippingAddress, customerInfo, payment } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Order must contain at least one item",
    };
  }

  for (const item of items) {
    if (!item.productId || !item.variantSku || !item.quantity || !item.price) {
      return {
        statusCode: 400,
        status: "bad",
        message:
          "Each item must have productId, variantSku, quantity, and price",
      };
    }
  }

  const requiresShipping =
    payment.method === "transfer" || payment.method === "delivery";
  if (requiresShipping && (!shippingAddress || !shippingAddress.line1)) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Shipping address is required",
    };
  }

  const customerInfoObj = await fetchCustomerInfo(
    isGuest,
    customerInfo,
    event.req.headers["authorization"] || "",
    baseUrl
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const idempotencyKey =
    event.req.headers["x-idempotency-key"] ||
    event.req.headers["idempotency-key"] ||
    undefined;

  const paymentObj = {
    method: payment.method,
    amount: totalAmount,
    status:
      payment.method === "transfer" || payment.method === "delivery"
        ? "pending"
        : "initiated",
    idempotencyKey:
      typeof idempotencyKey === "string"
        ? idempotencyKey
        : Array.isArray(idempotencyKey)
        ? idempotencyKey[0]
        : undefined,
  };

  if (payment.method === "transfer") {
    if (!payment.proof) {
      return {
        statusCode: 400,
        status: "bad",
        message: "Payment proof required for transfer",
      };
    }
    try {
      getDbConnection("images");
      const mimeMatch = payment.proof.match(/^data:([^;]+);base64,/);
      const mimetype = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const cleanBase64 = payment.proof.replace(/^data:([^;]+);base64,/, "");
      const image = new Image({
        filename: `payment-proof-${Date.now()}`,
        data: cleanBase64,
        mimetype,
      });
      const savedImage = await image.save();
      paymentObj.proof = {
        imageId: savedImage._id,
        filename: savedImage.filename,
      };
    } catch (err) {
      console.error("Image save error:", err);
      return {
        statusCode: 500,
        status: "bad",
        message: "Payment proof upload failed: " + err.message,
      };
    }
  }

  const orderCurrency =
    payment.method === "card"
      ? (env.STRIPE_CURRENCY || "USD").toUpperCase()
      : "NGN";

  const orderObj = {
    userId: isGuest ? null : userId,
    guestId: isGuest ? userId : null,
    items: items.map((item) => ({
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingAddress: requiresShipping ? shippingAddress : null,
    status: "pending",
    customerInfo: customerInfoObj,
    payment: paymentObj,
    totalAmount,
    currency: orderCurrency,
  };

  try {
    await connectDbOrders();

    if (orderObj.payment.idempotencyKey) {
      const existing = await Order.findOne({
        "payment.idempotencyKey": orderObj.payment.idempotencyKey,
      });
      if (existing) {
        return {
          status: "good",
          statusCode: 200,
          message: "Order already created",
          data: {
            orderId: existing._id.toString(),
            statusValue: existing.status,
            payment: existing.payment,
          },
        };
      }
    }

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

      if (
        inventoryStockUpdate.status !== "good" ||
        inventoryStockUpdate.statusCode !== 200
      ) {
        throw new Error(
          `Failed to update stock for SKU ${variantSku}: ${inventoryStockUpdate.message}`
        );
      }
    }

    await order.save();
    if (!isGuest) await removeFromCart(userId, items);

    return {
      status: "good",
      statusCode: 201,
      message: "Order created successfully.",
      data: {
        orderId: order._id.toString(),
        statusValue: order.status,
        payment: order.payment,
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
