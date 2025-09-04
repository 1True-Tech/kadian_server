/**
 * A single variant’s stock info
 * @typedef {Object} InventoryVariant
 * @property {string} sku - Matches the “sku” field in Sanity’s product.variant (e.g. “EB-CL-mens-ts”)
 * @property {number} stock - Current (live) stock level for this SKU
 * @property {number} stockThreshold - Minimum stock before alerting
 * @property {number} currentStock - Current stock level, synced from DB
 * @property {number} price - Price for this variant
 */

/**
 * A product’s inventory record
 * @typedef {Object} InventoryItem
 * @property {string} label - Label for the inventory item
 * @property {string} sanityProductId - The Sanity product ID this inventory document belongs to.
 * @property {string} slug
 * @property {InventoryVariant[]} variants - Array of all variants for the given product, each with its current stock.
 * @property {string} createdAt - ISO timestamp of when the inventory was created in MongoDB.
 * @property {string} updatedAt - ISO timestamp of when the inventory was last updated in MongoDB.
 */


/**
 * Response for GET /api/v1/inventory/:productId
 * @typedef {Object} InventoryGetResponse
 * @property {InventoryItem} [data]
 */

/**
 * Response for PUT /api/v1/inventory/:productId
 * @typedef {Object} InventoryPutResponse
 * @property {InventoryItem} [data]
 */

/**
 * Response for GET /api/v1/inventory/
 * @typedef {Object} InventoryItemsResponse
 * @property {InventoryItem[]} [data]
 */

/**
 * Response for GET /api/v1/inventory/stock
 * @typedef {Object} InventoryStockGetResponse
 * @property {InventoryVariant} [data]
 */
