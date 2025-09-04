/// <reference path="./user.js" />

/**
 * @typedef {"pending" | "paid" | "shipped" | "completed" | "cancelled"} OrderStatus
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} sanityProductId - Sanity product ID
 * @property {string} variantSku - Product variant SKU
 * @property {number} quantity - Quantity ordered (min: 1)
 * @property {number} price - Price per unit in kobo or cents
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} line1 - Address line 1
 * @property {string} [line2] - Address line 2 (optional)
 * @property {string} city - City
 * @property {string} state - State/Province/Region
 * @property {string} postal - Postal/ZIP code
 * @property {string} country - Country
 */

/**
 * @typedef {Object} CustomerInfo
 * @property {{
 *   first: string,
 *   last: string
 * }} name - Customer name (first and last)
 * @property {string} email - Customer email
 * @property {string} [phone] - Customer phone number (optional)
 */

/**
 * @typedef {Object} OrdersResponseData
 * @property {string} id - Order ID
 * @property {string} userId - User ID
 * @property {number} totalProducts - Total number of unique products
 * @property {number} totalItems - Total number of items
 * @property {number} totalAmount - Total order amount
 * @property {OrderStatus} status - Order status
 * @property {Date} createdAt - Order creation date
 * @property {Date} updatedAt - Order last update date
 */

/**
 * @typedef {Object} OrderListResponse
 * @property {OrdersResponseData[]} [orders] - List of orders
 */

/**
 * @typedef {Object} OrdersResponseDetails
 * @property {string} id - Order ID
 * @property {string} userId - User ID
 * @property {string} guestId - Guest ID
 * @property {number} totalProducts - Total number of unique products
 * @property {number} totalItems - Total number of items
 * @property {number} totalAmount - Total order amount
 * @property {OrderStatus} status - Order status
 * @property {Date} createdAt - Order creation date
 * @property {Date} updatedAt - Order last update date
 * @property {OrderItem[]} items - Order items
 * @property {ShippingAddress} [shippingAddress] - Shipping address
 */

/**
 * @typedef {Object} OrderDetailResponse
 * @property {OrdersResponseDetails} [order] - Order details
 */

/**
 * @typedef {Object} CreateOrderBody
 * @property {OrderItem[]} items - Order items
 * @property {ShippingAddress} shippingAddress - Shipping address
 * @property {CustomerInfo} customerInfo - Customer information
 */

/**
 * @typedef {Object} OrderCreateResponse
 * @property {string} [orderId] - Created order ID
 * @property {string} [statusValue] - Order status
 */

/**
 * @typedef {Object} OrderUpdateBody
 * @property {OrderStatus} status - New order status
 */
