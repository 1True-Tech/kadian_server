import connectMongoDb from "./connect-mongo-db.js";
import useMongoDb from "./use-mongo-db.js";

export default async function connectDbOrders() {
  const dbResponse = await connectMongoDb("orders");

  if (dbResponse.mongoDbStatus === "online") {
    return useMongoDb("orders");
  } else {
    console.error("Failed to connect to MongoDB:", dbResponse.message);
    throw new Error("Failed to connect to MongoDB");
  }
}
