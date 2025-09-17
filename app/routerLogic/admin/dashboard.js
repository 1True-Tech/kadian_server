import useCache from "../../../lib/utils/use-cache.js";

/**
 * @typedef {Object} RecentOrder
 * @property {string} id - Order ID
 * @property {string} customer - Customer name
 * @property {string} amount - Formatted order amount
 * @property {string} status - Order status
 */

/**
 * @typedef {Object} TopProduct
 * @property {string} sanityId - Sanity id
 * @property {number} sales - Number of sales
 * @property {string} revenue - Formatted revenue
 */

/**
 * @typedef {Object} TopUser
 * @property {string} id - User ID
 * @property {string} name - User name
 * @property {number} orders - Number of orders
 * @property {string} spent - Total amount spent
 */

/**
 * @typedef {Object} Stats
 * @property {('orders'|'revenue'|'users'|'products')} type - The metric type
 * @property {string} title - Display title for the metric
 * @property {string} value - Current value of the metric
 * @property {string} change - Percentage change with % symbol
 * @property {boolean} positive - Whether the change is positive
 */
/**
 * @typedef {Object} DashboardMetric
 * @property {RecentOrder[]} recentOrders - Display title for the metric
 * @property {TopProduct[]} topProducts - Current value of the metric
 * @property {TopUser[]} topUsers - Percentage change with % symbol
 * @property {Stats[]} stats - Whether the change is positive
 */

/**
 * @typedef {Object} TimeRange
 * @property {Date} start - Start date of the range
 * @property {Date} end - End date of the range
 */

const CACHE_KEY = "admin_dashboard_stats";
const CACHE_DURATION = 5; // 5 minutes TTL

/**
 * Gets the date range for comparison based on the period
 * @param {('day'|'month'|'year')} period - Time period for comparison
 * @returns {{ current: TimeRange, previous: TimeRange }}
 */
function getDateRanges(period) {
  const now = new Date();
  const current = {
    start: new Date(),
    end: new Date(),
  };
  const previous = {
    start: new Date(),
    end: new Date(),
  };

  switch (period) {
    case "day":
      current.start.setHours(0, 0, 0, 0);
      previous.start.setDate(previous.start.getDate() - 1);
      previous.start.setHours(0, 0, 0, 0);
      previous.end = new Date(current.start);
      break;
    case "month":
      current.start.setDate(1);
      current.start.setHours(0, 0, 0, 0);
      previous.start = new Date(current.start);
      previous.start.setMonth(previous.start.getMonth() - 1);
      previous.end = new Date(current.start);
      break;
    case "year":
      current.start.setMonth(0, 1);
      current.start.setHours(0, 0, 0, 0);
      previous.start = new Date(current.start);
      previous.start.setFullYear(previous.start.getFullYear() - 1);
      previous.end = new Date(current.start);
      break;
  }

  return { current, previous };
}

/**
 * Calculate revenue from orders
 * @param {Array<Order>} orders - List of orders to calculate revenue from
 * @returns {Promise<number>} Total revenue in cents
 */
async function calculateRevenue(orders) {
  return orders.reduce((total, order) => {
    if (order.payment && order.payment.status === "paid") {
      return total + order.payment.amount;
    }
    return total;
  }, 0);
}

/**
 * Calculate metrics for a specific time range
 * @param {TimeRange} timeRange - The time range to calculate metrics for
 * @param {string} baseUrl - Base URL for API calls
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - The request event
 * @returns {Promise<Object>} The calculated metrics
 */
async function calculateMetricsForRange(timeRange, baseUrl, event) {
  try {
    const { start, end } = timeRange;
    const headers = {
      authorization: "Bearer " + event.auth.token,
      "Content-Type": "application/json",
    };

    // Get data in parallel using base routes
    console.log(headers)
    const usersRes = await fetch(`${baseUrl}/users`, { headers }).then(
      async (res) => {
        if (!res.ok) throw new Error(`Users API returned status ${res.status}`);
        const data = await res.json();
        if (!data || !data.data)
          throw new Error("Invalid users response format");
        return data;
      }
    );
    const ordersRes = await fetch(`${baseUrl}/orders`, { headers }).then(
      async (res) => {
        if (!res.ok)
          throw new Error(`Orders API returned status ${res.status}`);
        const data = await res.json();

        if (!data || !data.orders)
          throw new Error("Invalid orders response format");
        return data;
      }
    );

    // Filter orders within the time range
    const orders = (ordersRes.orders || []).filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate < end;
    });

    // Filter users within the time range
    const users = (usersRes.data || []).filter((user) => {
      const userDate = new Date(user.createdAt);
      return userDate >= start && userDate < end;
    });

    const revenue = await calculateRevenue(orders);

    return {
      revenue,
      orders: orders.length,
      users: users.length,
      allOrders: ordersRes.orders || [], // Return all orders for other calculations
      allUsers: usersRes.data || [], // Return all users for other calculations
    };
  } catch (err) {
    throw new Error(`Error calculating metrics for range: ${err.message}`);
  }
}

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {{ change: number, positive: boolean }}
 */
function calculateChange(current, previous) {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, positive: current > 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return { change, positive: change >= 0 };
}

/**
 * Format currency in dollars
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted amount in dollars
 */
function formatCurrency(amount) {
  return `$${amount}`;
}

/**
 * Get recent orders with customer info
 * @param {Array<Order>} orders - List of orders
 * @returns {Promise<Array<RecentOrder>>}
 */
async function getRecentOrders(orders) {
  return orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      customer: order.customerInfo
        ? `${order.customerInfo.name.first} ${order.customerInfo.name.last}`
        : "Guest User",
      amount: formatCurrency(order.totalAmount),
      status: order.status,
    }));
}

/**
 * Calculate top products by revenue
 * @param {Array<Object>} orders - List of orders
 * @returns {Promise<Array<TopProduct>>}
 */
async function getTopProducts(orders) {
  const productStats = {};

  // Calculate sales and revenue for each product
  orders.forEach((order) => {
    if (order.payment.status !== "paid") return;

    order.items.forEach((item) => {
      const key = item.productId;
      if (!productStats[key]) {
        productStats[key] = {
          sanityId: item.productId,
          sales: 0,
          revenue: 0,
        };
      }
      productStats[key].sales += item.quantity;
      productStats[key].revenue += item.price * item.quantity;
    });
  });

  // Convert to array and sort by revenue
  return Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((product) => ({
      name: product.name,
      sales: product.sales,
      revenue: formatCurrency(product.revenue),
    }));
}

/**
 * Calculate top users by purchase amount
 * @param {Array<Object>} orders - List of orders
 * @returns {Promise<Array<TopUser>>}
 */
async function getTopUsers(orders) {
  const userStats = {};

  // Calculate orders and spending for each user
  orders.forEach((order) => {
    if (!order.userId || order.payment.status !== "paid") return;

    const key = order.userId.toString();
    if (!userStats[key]) {
      userStats[key] = {
        id: key,
        name: `${order.customerInfo.name.first} ${order.customerInfo.name.last}`,
        orders: 0,
        spent: 0,
      };
    }
    userStats[key].orders++;
    userStats[key].spent += order.payment.amount;
  });

  // Convert to array and sort by amount spent
  return Object.values(userStats)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map((user) => ({
      ...user,
      spent: formatCurrency(user.spent),
    }));
}

/**
 * Calculate stats for dashboard
 * @param {('day'|'month'|'year')} period - Time period for comparison
 * @returns {Promise<Array<DashboardMetric>>}
 */
async function calculateStats(period = "month", event) {
  try {
    const baseUrl = event.req.protocol + "://" + event.req.get("host");
    const ranges = getDateRanges(period);
    const current = await calculateMetricsForRange(
      ranges.current,
      baseUrl,
      event
    );
    const previous = await calculateMetricsForRange(
      ranges.previous,
      baseUrl,
      event
    );
    // Calculate changes
    const revenueMetrics = calculateChange(current.revenue, previous.revenue);
    const orderMetrics = calculateChange(current.orders, previous.orders);
    const userMetrics = calculateChange(current.users, previous.users);

    // Get current product count from inventory API
    const inventoryRes = await fetch(`${baseUrl}/inventory`, {
      headers: {
        authorization: "Bearer " + event.auth.token,
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (!res.ok)
        throw new Error(`Inventory API returned status ${res.status}`);
      const data = await res.json();
      if (!data || !data.data)
        throw new Error("Invalid inventory response format");
      return data;
    });
    const productCount = inventoryRes.data?.length || 0;

    // Calculate additional metrics using the fetched data
    const recentOrders = await getRecentOrders(current.allOrders);
    const topProducts = await getTopProducts(current.allOrders);
    const topUsers = await getTopUsers(current.allOrders);

    // Prepare statistics
    /** @type {Array<Stats>} */
    const stats = [
      {
        type: "revenue",
        title: "Total Revenue",
        value: `$${(current.revenue / 100).toFixed(2)}`,
        change: `${revenueMetrics.change.toFixed(1)}%`,
        positive: revenueMetrics.positive,
      },
      {
        type: "orders",
        title: "Orders",
        value: current.orders.toString(),
        change: `${orderMetrics.change.toFixed(1)}%`,
        positive: orderMetrics.positive,
      },
      {
        type: "users",
        title: "Customers",
        value: current.users.toString(),
        change: `${userMetrics.change.toFixed(1)}%`,
        positive: userMetrics.positive,
      },
      {
        type: "products",
        title: "Active Products",
        value: productCount.toString(),
        change: "N/A",
        positive: true,
      },
    ];
    const data = { stats, recentOrders, topProducts, topUsers };
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard statistics with caching
 * @param {Omit<import('../../../lib/utils/withErrorHandling.js').RouteEvent, 'query'> & {query:{period?:'day'|'month'|'year'}}} event - Query parameters
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function getDashboardStats(event) {
  try {
    const period = event.query?.period || "month";
    const cacheKey = `${CACHE_KEY}_${period}`;
    const data = await useCache(
      cacheKey,
      async () => await calculateStats(period, event),
      CACHE_DURATION
    );

    if (!data) {
      throw new Error("Failed to calculate dashboard statistics");
    }

    return {
      statusCode: 200,
      message: "Dashboard statistics retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return {
      statusCode: 500,
      message: "Failed to retrieve dashboard statistics: " + error.message,
    };
  }
}
