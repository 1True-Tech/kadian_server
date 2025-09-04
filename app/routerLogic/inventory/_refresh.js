/// <reference path="../../../types/product.js" />
import connectDbInventory from "../../../lib/utils/mongo/connect-db-inventory.js";
import objectErrorBoundary from "../../../lib/utils/objectErrorBoundary.js";
import removeFromObjectArray from "../../../lib/utils/removeFromObjectArray.js";
import Inventory from "../../../models/inventory.js";

/**
 *
 * @param {Omit<import("../../../lib/utils/withErrorHandling.js").RouteEvent,'body'|'query'>&{body:{data:Product[]};query:{refreshType:"new"|"full"}}} event
 * @returns {Promise<generalResponse>}
 */
export default async function refreshInventory(event) {
  const {
    errorMessage,
    hasError,
    object: body,
  } = objectErrorBoundary(event.body, ["data"], {
    checkers: {
      data: {
        /**
         *
         * @param {Product[]} val
         */
        action(val) {
          const isEmpty = !Array.isArray(val) || val.length === 0;
          if (isEmpty) return false;
          // no empty variant
          for (const p of val) {
            if (!Array.isArray(p.variants) || p.variants.length === 0)
              return false;
          }
          const allHaveId = val.every(
            (p) => typeof p.id === "string" && p.id.trim().length > 0
          );
          const allHaveSlug = val.every(
            (p) => typeof p.slug === "string" && p.slug.trim().length > 0
          );
          return allHaveId && allHaveSlug;
        },
        message:
          "Data must be a non-empty array of products with at least one variant each, and each product must have a valid id and slug.",
      },
    },
  });
  if (!body || hasError) {
    return {
      statusCode: 400,
      status: "bad",
      message: "Invalid request body: " + errorMessage,
    };
  }
  const { refreshType = "new" } = event.query;

  // 2) Connect to MongoDB
  try {
    await connectDbInventory();
  } catch (err) {
    return {
      statusCode: 500,
      status: "bad",
      message: "DB connection failed",
    };
  }

  const productData = body.data;

  // 3) Prepare metadata and existing docs
  const allMeta = productData.map((p) => ({ id: p.id, slug: p.slug }));
  const idList = allMeta.map((m) => m.id);
  const existingDocs = await Inventory.find({
    sanityProductId: { $in: idList },
  })
    .select("sanityProductId label slug variants")
    .lean();
  const existingMap = new Map(
    existingDocs.map((doc) => [doc.sanityProductId, doc])
  );
  const existingSet = new Set(existingDocs.map((d) => d.sanityProductId));

  // 4) Determine items to fetch
  const toFetchMeta =
    refreshType === "full"
      ? allMeta
      : allMeta.filter((m) => !existingSet.has(m.id));
  if (refreshType === "new" && toFetchMeta.length === 0) {
    return { status: "good", message: "No new products to insert" };
  }


  // 6) Construct bulk operations
  const ops = [];
  for (const det of productData) {
    const p = det;
    const isExisting = existingSet.has(p.id);

    const updatedVariants = p.variants.map((v) => {
      const oldDoc = existingMap.get(p.id);
      const oldVar = oldDoc?.variants.find((x) => x.sku === v.sku);
      const sold = oldVar ? oldVar.stock - oldVar.currentStock : 0;
      const currentStock = Math.max(v.stock - sold, 0);
      return {
        sku: v.sku,
        stock: v.stock||0,
        currentStock,
        stockThreshold: v.stockThreshold||0,
        price: v.price||0,
      };
    });

    const fullDoc = {
      sanityProductId: p.id,
      label: p.name,
      slug: p.slug,
      variants: updatedVariants,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    if (refreshType === "new") {
      if (!isExisting) {
        ops.push({
          updateOne: {
            filter: { sanityProductId: p.id },
            update: { $setOnInsert: fullDoc },
            upsert: true,
          },
        });
      }
    } else {
      let old;
      if (isExisting) {
        old = existingMap.get(p.id);
      }
      if (
        old &&
        old.label === fullDoc.label &&
        old.slug === fullDoc.slug &&
        JSON.stringify(removeFromObjectArray(old.variants, "_id")) ===
          JSON.stringify(fullDoc.variants)
      ) {
        continue;
      } else {
        ops.push({
          replaceOne: {
            filter: { sanityProductId: p.id },
            replacement: fullDoc,
            upsert: true,
          },
        });
      }
    }
  }

  // 7) Early exit if no operations
  if (ops.length === 0) {
    return {
      statusCode: 200,
      message:
        refreshType === "full"
          ? "Full sync done. No changes detected."
          : "New-only sync done. No new products.",
    };
  }

  // 8) Execute bulkWrite
  const result = await Inventory.bulkWrite(ops, { ordered: false });

  const inventoryItems = await Inventory.find({}).lean();

  return {
    statusCode: 200,
    message:
      refreshType === "full"
        ? `Full sync done. ${result.upsertedCount} created, ${result.modifiedCount} updated.`
        : `New-only sync done. ${result.upsertedCount} new products added.`,
    data: inventoryItems,
  };
}
