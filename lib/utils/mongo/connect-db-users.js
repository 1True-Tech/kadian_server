import User from "../../../models/user.js";
import connectMongoDb from "./connect-mongo-db.js";
import useMongoDb from "./use-mongo-db.js";

export default async function connectDbUsers () {
    const dbResponse = await connectMongoDb("users");
    if (dbResponse.mongoDbStatus === "online") {
         await User.syncIndexes();
        return useMongoDb("users");
    } else {
        console.error("Failed to connect to MongoDB:", dbResponse.message);
        throw new Error("Failed to connect to MongoDB");
    }
}