// Core express dependencies
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

// Helpers
import withErrorHandling from "../lib/utils/withErrorHandling.js";
import routeHandler from "../lib/utils/routeHandler.js";

// Route logic
import { healthLogic } from "./routerLogic/index.js";
import env from "../lib/constants/env.js";
import useRouter from "../lib/utils/routeHandler.js";
import auth from "./routerLogic/auth/index.js";
import orders from "./routerLogic/orders/index.js";
import inventory from "./routerLogic/inventory/index.js";

// App setup
const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const router = useRouter(app);

// Routes
// auth
router({
  method: "get",
  path: "/health",
  handler: withErrorHandling(healthLogic),
});

router({
  method: "post",
  path: "/auth/login",
  handler: withErrorHandling(auth.login),
});
router({
  method: "post",
  path: "/auth/register",
  handler: withErrorHandling(auth.register),
});
// user info
router({
  method: "get",
  path: "/auth/me",
  handler: withErrorHandling(auth.me.myInfo, { requireAuth: true }),
});
router({
  method: "patch",
  path: "/auth/me",
  handler: withErrorHandling(auth.me.myInfoPatch, { requireAuth: true }),
});

router({
  method: "delete",
  path: "/auth/me",
  handler: withErrorHandling(auth.me.myInfoDelete, { requireAuth: true }),
});

// cart
router({
  method: "get",
  path: "/auth/me/cart",
  handler: withErrorHandling(auth.me.cart.myCart, { requireAuth: true }),
});
router({
  method: "patch",
  path: "/auth/me/cart",
  handler: withErrorHandling(auth.me.cart.myCartPatch, { requireAuth: true }),
});

router({
  method: "delete",
  path: "/auth/me/cart",
  handler: withErrorHandling(auth.me.cart.myCartDelete, { requireAuth: true }),
});
// cart-item
router({
  method: "get",
  path: "/auth/me/cart/:id",
  handler: withErrorHandling(auth.me.cart.CartItem.get, { requireAuth: true }),
});
router({
  method: "patch",
  path: "/auth/me/cart/:id",
  handler: withErrorHandling(auth.me.cart.CartItem.patch, { requireAuth: true }),
});

router({
  method: "delete",
  path: "/auth/me/cart/:id",
  handler: withErrorHandling(auth.me.cart.CartItem.deleteItem, { requireAuth: true }),
});
// wishlist
router({
  method: "get",
  path: "/auth/me/wishlist",
  handler: withErrorHandling(auth.me.wishlist.myWishlist, { requireAuth: true }),
});
router({
  method: "patch",
  path: "/auth/me/wishlist",
  handler: withErrorHandling(auth.me.wishlist.myWishlistPatch, { requireAuth: true }),
});

router({
  method: "delete",
  path: "/auth/me/wishlist",
  handler: withErrorHandling(auth.me.wishlist.myWishlistDelete, { requireAuth: true }),
});
// wishlist-item
router({
  method: "get",
  path: "/auth/me/wishlist/:id",
  handler: withErrorHandling(auth.me.wishlist.wishListItem.get, { requireAuth: true }),
});

router({
  method: "delete",
  path: "/auth/me/wishlist/:id",
  handler: withErrorHandling(auth.me.wishlist.wishListItem.deleteItem, { requireAuth: true }),
});

// orders
router({
  method: "get",
  path: "/orders",
  handler: withErrorHandling(orders.get, {requireAuth:true,allowedRoles:["admin"]}),
});
router({
  method: "get",
  path: "/orders-by-user",
  handler: withErrorHandling(orders.getByUser),
});

router({
  method: "post",
  path: "/orders",
  handler: withErrorHandling(orders.post),
});
// orders-item
router({
  method: "get",
  path: "/orders/:id",
  handler: withErrorHandling(orders.orderItem.getOrder),
});
router({
  method: "patch",
  path: "/orders/:id",
  handler: withErrorHandling(orders.orderItem.updateOrder, {requireAuth:true,allowedRoles:["admin"]}),
});

router({
  method: "delete",
  path: "/orders/:id/cancel",
  handler: withErrorHandling(orders.orderItem.deleteOrder),
});
router({
  method: "delete",
  path: "/orders/:id",
  handler: withErrorHandling(orders.orderItem.permanentlyDeleteOrder, {requireAuth:true,allowedRoles:["admin"]}),
});

// inventory

router({
  method: "get",
  path: "/inventory",
  handler: withErrorHandling(inventory.get),
});
router({
  method: "post",
  path: "/inventory/_refresh",
  handler: withErrorHandling(inventory.refreshInventory, {requireAuth:true,allowedRoles:["admin"]}),
});
// inventory-item
router({
  method: "get",
  path: "/inventory/:productId",
  handler: withErrorHandling(inventory.inventoryItem.get),
});
router({
  method: "patch",
  path: "/inventory/:productId",
  handler: withErrorHandling(inventory.inventoryItem.patch),
});
// inventory-item-sku
router({
  method: "get",
  path: "/inventory/:productId/:sku",
  handler: withErrorHandling(inventory.inventoryItem.inventoryItemSku.get),
});
router({
  method: "patch",
  path: "/inventory/:productId/:sku/stock",
  handler: withErrorHandling(inventory.inventoryItem.inventoryItemSku.stockUpdate),
});


// Starting the server
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
  console.log(`🔗 Test it at: http://localhost:${PORT}/health`);
  console.log(`💡 Tip: You can use Postman or your browser to hit the route.`);
});
