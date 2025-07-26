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

// App setup
const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
routeHandler({
  app,
  method: "get",
  path: "/health",
  handler: withErrorHandling(healthLogic),
});

// Starting the server
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
  console.log(`🔗 Test it at: http://localhost:${PORT}/health`);
  console.log(`💡 Tip: You can use Postman or your browser to hit the route.`);
});
