/**
 * @typedef {Object} InventoryVariant
 * @property {string} sku Matches the Sanity variant SKU
 * @property {number} stock Current stock level
 * @property {number} stockThreshold
 * @property {number} currentStock Current live stock (from DB)
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} sanityProductId The Sanity product ID
 * @property {string} label Label for the inventory item
 * @property {string} slug Product slug
 * @property {InventoryVariant[]} variants Array of variant stock info
 * @property {string} updatedAt ISO timestamp of last update
 */

/**
 * Parse and normalize an inventory item.
 *
 * @param {InventoryItem} item Raw inventory item
 * @returns {InventoryItem} Parsed inventory item
 */
export default function parseInventoryItem(item) {
  if (!item || typeof item !== "object") {
    throw new Error("Invalid inventory item format");
  }

  const { sanityProductId, variants, updatedAt, label, slug } = item;

  const parsedVariants = variants.map((variant) => ({
    sku: variant.sku,
    stock: variant.stock || 0, // Default to 0 if not provided
    currentStock: variant.currentStock ?? 0,
    stockThreshold: variant.stockThreshold,
  }));

  return {
    sanityProductId,
    variants: parsedVariants,
    updatedAt,
    label,
    slug,
  };
}
