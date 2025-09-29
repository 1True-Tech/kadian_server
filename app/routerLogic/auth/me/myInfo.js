import processUserData from "../../../../lib/data-processors/process-user-data.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import connectDbOrders from "../../../../lib/utils/mongo/connect-db-orders.js";
import User from "../../../../models/user.js";
import Order from "../../../../models/order.js";
import parseOrderItem from "../../../../lib/utils/parseOrderItem.js";

/**
 * @param {import("../../../../lib/utils/withErrorHandling").RouteEvent} event
 * @returns {Partial<generalResponse>}
 */
export default async function myInfo(event) {
  const auth = event.auth;
  const includeOrders = event.query?.include_orders === 'true';
  
  // Connect to MongoDB
  try {
    await connectDbUsers();
  } catch (error) {
    return {
      statusCode: 500,
      status: "bad",
      message: "Failed to connect to database while fetching user.",
    };
  }
  try {
    // 2. Get user data
    const user = await User.findById(auth.userId);
    if (!user) {
      return {
        statusCode: 404,
        status: "bad",
        message: "User not found",
      };
    }
    // update last seen
    user.lastSeen = new Date();
    await user.save();

    // Process user data
    const userData = processUserData(user);
    
    // 3. Include orders if requested
    if (includeOrders) {
      try {
        await connectDbOrders();
        const orders = await Order.find({ userId: auth.userId }).sort({
          createdAt: -1,
        });
        
        // Add orders to user data
        userData.orders = parseOrderItem(orders);
      } catch (orderError) {
        console.error("Error fetching orders:", orderError);
        // Continue without orders if there's an error
        userData.orders = [];
      }
    }

    // Return user profile with optional orders
    return {
      statusCode: 200,
      status: "good",
      message: "User profile retrieved successfully",
      data: userData,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
