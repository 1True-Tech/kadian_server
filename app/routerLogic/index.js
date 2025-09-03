/// <reference path="../../types/index.js" />
/// <reference path="../../lib/utils/routeHandler.js" />

import connectMongoDb from "../../lib/utils/mongo/connect-mongo-db.js";

/**
 * @param {import("../../lib/utils/routeHandler.js").RouteEvent} event
 * @returns {Promise<generalResponse>}
 */
export async function healthLogic(event) {
  const mongoAvailable = await connectMongoDb();
  const isOnline = event.res.locals.isOnline;
  const issues = [];

  if (isOnline === "offline") {
    issues.push("Unable to reach the Internet");
  }
  if (mongoAvailable.statusCode && mongoAvailable.statusCode !== 200) {
    issues.push("MongoDB connection failed");
  }
  const message = issues.length
    ? `Warning: ${issues.join(", ")}.
Please check your network and service configurations.`
    : "All systems are operational and running smoothly.";

  return {
    status: issues.length > 0 ? "bad" : "good",
    message,
    connectionActivity: isOnline,
    statusCode: issues.length > 0 ? mongoAvailable.statusCode || 500 : 200,
  };
}
