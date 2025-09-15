/// <reference path="../../types/order.js" />

/**
 * Parse a single order object into a standardized format
 * @param {Object} order - Raw order object
 * @returns {OrdersResponseDetails} Parsed order details
 * @throws {Error} If order object is invalid
 */
export default function parseOrderInfo(order) {
  if (!order || typeof order !== "object") {
    throw new Error("Invalid order object");
  }

   return {
      id: order._id.toString(),
      userId: order.userId ? order.userId.toString() : null,
      guestId: order.guestId || null,

      // counts
      totalProducts: items.length,
      totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalAmount: items.reduce(
        (sum, item) => sum + (item.quantity * item.price || 0),
        0
      ),

      // status
      status: order.status,

      // payment
      payment: order.payment
        ? {
            method: order.payment.method,
            reference: order.payment.reference || null,
            amount: order.payment.amount,
            status: order.payment.status,
            proof: order.payment.proof
              ? {
                  imageId: order.payment.proof.imageId?.toString() || null,
                  filename: order.payment.proof.filename || null,
                }
              : null,
            paidAt: order.payment.paidAt || null,
          }
        : null,

      // shipping address (flattening optional)
      shippingAddress: order.shippingAddress || null,

      // customer info
      customerInfo: order.customerInfo
        ? {
            name: {
              first: order.customerInfo.name.first,
              last: order.customerInfo.name.last,
            },
            email: order.customerInfo.email,
            phone: order.customerInfo.phone || null,
          }
        : null,

      // timestamps
      createdAt: order.createdAt ? new Date(order.createdAt) : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : null,
    };
}