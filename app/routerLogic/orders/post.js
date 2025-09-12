/// <reference path="../../../types/order.js" />
import fetchCustomerInfo from "../../../lib/utils/fetch-customer-info.js";
import connectDbOrders from "../../../lib/utils/mongo/connect-db-orders.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import Order from "../../../models/order.js";
import Image from "../../../models/image.js";

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

  const { object: body, hasError, errorMessage } = objectErrorBoundary(
    event.body,
    [
      "items",
      "shippingAddress",
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

  const customerInfoObj = await fetchCustomerInfo(
    isGuest,
    customerInfo,
    event.auth?.token || "",
    baseUrl
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const paymentObj = {
    method: payment.method,
    amount: totalAmount,
    status: payment.method === "transfer" ? "pending" : "initiated",
  };

  if (payment.method === "transfer" && payment.proofBase64) {
    try {
      // Save image to MongoDB
      const image = new Image({
        filename: `payment-proof-${Date.now()}`,
        data: payment.proofBase64,
        mimetype: payment.proofBase64.split(';')[0].split(':')[1] || 'image/jpeg'
      });
      await image.save();

      // Store the image reference in payment object
      paymentObj.proof = {
        imageId: image._id,
        filename: image.filename
      };
    } catch (err) {
      return {
        statusCode: 500,
        status: "bad",
        message: "Payment proof upload failed: " + err.message,
      };
    }
  }

  const orderObj = {
    userId: isGuest ? null : userId,
    guestId: isGuest ? userId : null,
    items,
    shippingAddress,
    totalAmount,
    status: "pending",
    customerInfo: customerInfoObj,
    payment: paymentObj,
  };

  try {
    await connectDbOrders();
    const order = new Order(orderObj);

    for (const item of items) {
      const { sku, quantity, slug } = item;
      console.log(`${baseUrl}/inventory/${slug}/${sku}/stock`)
      const inventoryStockUpdate = await fetch(
        `${baseUrl}/inventory/${slug}/${sku}/stock`,
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
