/**
 * A single product variant used in Inventory sync.
 * @typedef {Object} ProductVariant
 * @property {string} sku - Stock Keeping Unit, unique per variant.
 * @property {number} stock - Current stock level.
 * @property {number} stockThreshold - Minimum stock before alerting
 * @property {number} price - Price of the variant.
 */

/**
 * A product object as used in Inventory sync.
 * @typedef {Object} Product
 * @property {string} id - Unique product ID from Sanity.
 * @property {string} slug - URL slug of the product.
 * @property {string} name - Name of the product.
 * @property {ProductVariant[]} variants - Variants belonging to this product.
 * @property {string} createdAt - ISO timestamp when product was created.
 * @property {string} updatedAt - ISO timestamp when product was last updated.
 */
