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

// App setup
const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const router = useRouter(app);

// Routes
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

app.get("/logout", function (request, response) {});

app.get("/cart", function (request, response) {
  //View contents of shopping cart
});

app.get("/services", function (request, response) {});

app.get("/shop", function (request, response) {});

app.get("/products/:id", function (request, response) {});

app.get("/consultation", function (request, response) {});

app.get("/sale", function (request, response) {});

app.get("/guides", function (request, response) {});

app.get("/about", function (request, response) {});

app.post("/addproduct", function (request, response) {});

app.get("/contact", function (request, response) {});

// Starting the server
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
  console.log(`🔗 Test it at: http://localhost:${PORT}/health`);
  console.log(`💡 Tip: You can use Postman or your browser to hit the route.`);
});
