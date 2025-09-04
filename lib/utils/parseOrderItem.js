/// <reference path="../../types/order.js" />

/**
 * Parse order data into a standardized format
 * @param {Object[]} data - Raw order data array
 * @returns {OrdersResponseData[]} Parsed order data array
 */
export default function parseOrderItem(data) {
  if (!Array.isArray(data)) return [];
  return data.map(order => ({
    id: order._id,
    userId: order.userId,
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
  }));
}