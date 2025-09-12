// Core express dependencies
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

// Security middleware
import { authRateLimit, generalRateLimit } from "../lib/middleware/rateLimiter.js";
import securityHeaders from "../lib/middleware/securityHeaders.js";

// Helpers
import withErrorHandling from "../lib/utils/withErrorHandling.js";

// Route logic
import env from "../lib/constants/env.js";
import useRouter from "../lib/utils/routeHandler.js";
import auth from "./routerLogic/auth/index.js";
import { homeLogic } from "./routerLogic/home.js";
import { healthLogic } from "./routerLogic/index.js";
import inventory from "./routerLogic/inventory/index.js";
import orders from "./routerLogic/orders/index.js";
import admin from "./routerLogic/admin/index.js";

// App setup
const app = express();
const PORT = env.PORT;

// static
app.use(express.static("public")); 

// Security middleware
app.use(securityHeaders);
app.use(generalRateLimit);

// Middleware
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? [...env.ALLOWEDDOMAIN.split(",")] // Replace with your actual domain
    : ['http://localhost:8000', 'http://localhost:3000'], // Development origins
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json({ limit: '10mb' })); // Limit payload size
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const router = useRouter(app);

// Routes
// Home route with API documentation
router({
  method: "get",
  path: "/",
  handler: withErrorHandling(homeLogic),
});

// Health check
router({
  method: "get",
  path: "/health",
  handler: withErrorHandling(healthLogic),
});

// Apply stricter rate limiting to auth routes
app.use('/auth/login', authRateLimit);
app.use('/auth/register', authRateLimit);

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

// Public order routes
router({
  method: "get",
  path: "/orders-by-user",
  handler: withErrorHandling(orders.getByUser, { requireAuth: true }),
});
router({
  method: "post",
  path: "/orders",
  handler: withErrorHandling(orders.post, { requireAuth: true }),
});
router({
  method: "get",
  path: "/orders/:id",
  handler: withErrorHandling(orders.orderItem.getOrder, { requireAuth: true }),
});
router({
  method: "delete",
  path: "/orders/:id/cancel",
  handler: withErrorHandling(orders.orderItem.deleteOrder, { requireAuth: true }),
});


// Public inventory routes
router({
  method: "get",
  path: "/inventory",
  handler: withErrorHandling(inventory.get),
});
router({
  method: "get",
  path: "/inventory/:productId",
  handler: withErrorHandling(inventory.inventoryItem.get),
});
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
router({
  method: "get",
  path: "/admin/dashboard",
  handler: withErrorHandling(admin.dashboard.getStats, { requireAuth: true, allowedRoles:["admin"] }),
});


// Starting the server
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
  console.log(`🏠 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`💡 Tip: Visit the home route for comprehensive API documentation.`);
});
