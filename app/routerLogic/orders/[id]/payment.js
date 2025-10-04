/// <reference path="../../../../types/order.js" />
import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import objectErrorBoundary from "../../../../lib/utils/objectErrorBoundary.js";
import Order from "../../../../models/order.js";
import Image from "../../../../models/image.js";
import env from "../../../../lib/constants/env.js";
import getDbConnection from "../../../../lib/utils/mongo/get-db-connection.js";

/**
 *
 * @param {Omit<import("../../../../lib/utils/withErrorHandling.js").RouteEvent, 'params'|'body'> & {params:{id:string};body:{status:OrderStatus}}} event Parameters containing the order ID
 * @returns
 */
export async function paymentPatch(event) {
  const { id } = event.params;
  const {
    object: body,
    hasError,
    errorMessage,
  } = objectErrorBoundary(event.body, ["idempotencyKey", "payment.method"]);

  if (hasError || !body) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Validation failed: " + errorMessage,
    };
  }

  const { payment, customerInfo } = body;

  try {
    await connectDbOrders();
    const order = await Order.findById(id);
    if (!order) {
      return { statusCode: 404, status: "bad", message: "Order not found" };
    }

    // Guest security check
    if (!event.auth || event.auth.userRole === "guest") {
      if (!customerInfo || !customerInfo.email) {
        return {
          statusCode: 403,
          status: "bad",
          message: "Guest must provide email to update payment",
        };
      }
      if (order.customerInfo?.email !== customerInfo.email) {
        return {
          statusCode: 403,
          status: "bad",
          message: "Email does not match order record",
        };
      }
    }

    const totalAmount = order.totalAmount;
    const idempotencyKey = body.idempotencyKey || null;

    const paymentObj = {
      method: payment.method,
      amount: totalAmount,
      status: "pending",
      idempotencyKey: Array.isArray(idempotencyKey)
        ? idempotencyKey[0]
        : idempotencyKey,
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

    order.payment = paymentObj;
    order.currency = orderCurrency;
    if (payment.method === "delivery" || payment.method === "transfer") {
      order.status = "placed";
    }

    await order.save();

    return {
      status: "good",
      statusCode: 200,
      message: "Payment updated successfully.",
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
        "Failed to update payment: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}
