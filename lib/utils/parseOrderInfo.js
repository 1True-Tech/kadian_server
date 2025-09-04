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
    id: order._id,
    userId: order.userId,
    guestId: order.guestId,
    totalProducts: Array.isArray(order.items) ? order.items.length : 0,
    totalItems: Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0,
    totalAmount: Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + (item.price || 0), 0)
      : 0,
    status: order.status,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    items: Array.isArray(order.items)
      ? order.items.map(item => ({
          sanityProductId: item.sanityProductId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          price: item.price,
        }))
      : [],
    shippingAddress: order.shippingAddress
      ? {
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postal: order.shippingAddress.postal,
          country: order.shippingAddress.country,
        }
      : undefined,
  };
}