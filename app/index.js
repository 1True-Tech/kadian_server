// Core express dependencies
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

// Security middleware
import { authRateLimit, generalRateLimit } from "../lib/middleware/rateLimiter.js";
import { dynamicRequestSizeLimit } from "../lib/middleware/requestLimits.js";
import helmetMiddleware from "../lib/middleware/securityHeaders.js";

// Structured logging
import pino from 'pino';
import pinoHttp from 'pino-http';

// Helpers
import withErrorHandling from "../lib/utils/withErrorHandling.js";

// Route logic
import env from "../lib/constants/env.js";
import useRouter from "../lib/utils/routeHandler.js";
import admin from "./routerLogic/admin/index.js";
import auth from "./routerLogic/auth/index.js";
import { homeLogic } from "./routerLogic/home.js";
import images from "./routerLogic/images/index.js";
import { healthLogic } from "./routerLogic/index.js";
import inventory from "./routerLogic/inventory/index.js";
import orders from "./routerLogic/orders/index.js";
import payments from "./routerLogic/payments/index.js";

// App setup
const app = express();
const PORT = env.PORT;

// Configure structured logger
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

// Add logger to request object
const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} failed with ${err.message}`
});

// Static files
app.use(express.static("public")); 

// Security middleware
app.use(helmetMiddleware);
app.use(generalRateLimit);
app.use(httpLogger);

// CORS configuration with strict options
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? [...env.ALLOWEDDOMAIN.split(",")] 
    : ['http://localhost:8000', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Request size limits - apply before body parsers
app.use(dynamicRequestSizeLimit);

// Body parsers with appropriate limits
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

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
  method: "post",
  path: "/inventory_refresh",
  handler: withErrorHandling(inventory.refreshInventory, { requireAuth: true, allowedRoles:["admin"] }),
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

// Admin user management routes
router({
  method: "get",
  path: "/users",
  handler: withErrorHandling(admin.users.list, { requireAuth: true, allowedRoles: ["admin"] }),
});

router({
  method: "get",
  path: "/users/:userId",
  handler: withErrorHandling(admin.users.getDetails, { requireAuth: true, allowedRoles: ["admin"] }),
});

router({
  method: "patch",
  path: "/users/:userId/role",
  handler: withErrorHandling(admin.users.updateRole, { requireAuth: true, allowedRoles: ["admin"] }),
});

router({
  method: "delete",
  path: "/users/:userId",
  handler: withErrorHandling(admin.users.delete, { requireAuth: true, allowedRoles: ["admin"] }),
});

// admin orders route
router({
  method: "get",
  path: "/orders",
  handler: withErrorHandling(orders.get, { requireAuth: true, allowedRoles: ["admin"] }),
});

router({
  method: "get",
  path: "/images",
  handler: withErrorHandling(images.get),
});
router({
  method: "get",
  path: "/images/:id",
  handler: withErrorHandling(images.getItem),
});

// Payment routes - Stripe
router({
  method: "post",
  path: "/payments/stripe/create-checkout-session",
  handler: withErrorHandling(payments.stripe.createCheckoutSession),
});

router({
  method: "post",
  path: "/payments/stripe/webhook",
  handler: withErrorHandling(payments.stripe.webhook),
});

// Payment routes - PayPal
// router({
//   method: "post",
//   path: "/payments/paypal/create-order",
//   handler: withErrorHandling(payments.paypal.createOrder),
// });

// router({
//   method: "post",
//   path: "/payments/paypal/capture-order",
//   handler: withErrorHandling(payments.paypal.captureOrder),
// });

// router({
//   method: "post",
//   path: "/payments/paypal/webhook",
//   handler: withErrorHandling(payments.paypal.webhook),
// });

// Starting the server
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
  console.log(`🏠 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`💡 Tip: Visit the home route for comprehensive API documentation.`);
});
