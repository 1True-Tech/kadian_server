import connectMongoDb from "./connect-mongo-db.js";
import useMongoDb from "./use-mongo-db.js";

export default async function connectDbInventory() {
    const dbResponse = await connectMongoDb("inventory");

    if (dbResponse.mongoDbStatus === "online") {
        return useMongoDb("inventory");
    } else {
        console.error("Failed to connect to MongoDB:", dbResponse.message);
        throw new Error("Failed to connect to MongoDB");
    }
}