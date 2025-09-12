import Order from '../../../models/order.js';
import User from '../../../models/user.js';
import MetricHistory from '../../../models/metricHistory.js';
import useCache from '../../../lib/utils/use-cache.js';

/**
 * @typedef {Object} DashboardMetric
 * @property {('orders'|'revenue'|'users'|'products')} type - The metric type
 * @property {string} title - Display title for the metric
 * @property {string} value - Current value of the metric
 * @property {string} change - Percentage change with % symbol
 * @property {boolean} positive - Whether the change is positive
 */

/**
 * @typedef {Object} TimeRange
 * @property {Date} start - Start date of the range
 * @property {Date} end - End date of the range
 */

const CACHE_KEY = 'admin_dashboard_stats';
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
        end: new Date()
    };
    const previous = {
        start: new Date(),
        end: new Date()
    };

    switch(period) {
        case 'day':
            current.start.setHours(0,0,0,0);
            previous.start.setDate(previous.start.getDate() - 1);
            previous.start.setHours(0,0,0,0);
            previous.end = new Date(current.start);
            break;
        case 'month':
            current.start.setDate(1);
            current.start.setHours(0,0,0,0);
            previous.start = new Date(current.start);
            previous.start.setMonth(previous.start.getMonth() - 1);
            previous.end = new Date(current.start);
            break;
        case 'year':
            current.start.setMonth(0, 1);
            current.start.setHours(0,0,0,0);
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
        if (order.payment && order.payment.status === 'paid') {
            return total + order.payment.amount;
        }
        return total;
    }, 0);
}

/**
 * Calculate metrics for a specific time range
 * @param {TimeRange} timeRange - The time range to calculate metrics for
 * @returns {Promise<Object>} The calculated metrics
 */
async function calculateMetricsForRange(timeRange) {
    const { start, end } = timeRange;
    
    // Get orders in range
    const orders = await Order.find({
        createdAt: { $gte: start, $lt: end }
    }).lean();
    
    const revenue = await calculateRevenue(orders);
    const orderCount = orders.length;
    
    // Get user count (users created in range)
    const userCount = await User.countDocuments({
        createdAt: { $gte: start, $lt: end }
    });

    return {
        revenue,
        orders: orderCount,
        users: userCount
    };
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
 * Calculate stats for dashboard
 * @param {('day'|'month'|'year')} period - Time period for comparison
 * @returns {Promise<Array<DashboardMetric>>}
 */
async function calculateStats(period = 'month') {
    try {
        const ranges = getDateRanges(period);
        const current = await calculateMetricsForRange(ranges.current);
        const previous = await calculateMetricsForRange(ranges.previous);

        // Store current metrics in history
        await MetricHistory.create([
            { type: 'revenue', value: current.revenue },
            { type: 'orders', value: current.orders },
            { type: 'users', value: current.users }
        ]);
            
        // Calculate changes
        const revenueMetrics = calculateChange(current.revenue, previous.revenue);
        const orderMetrics = calculateChange(current.orders, previous.orders);
        const userMetrics = calculateChange(current.users, previous.users);

        // Get current product count
        const baseUrl = event.req.protocol + "://" + event.req.get("host");
        const inventoryRes = await fetch(`${baseUrl}/inventory`).then(res => res.json());
        const productCount = inventoryRes.data?.length || 0;

        // Prepare statistics
        /** @type {Array<DashboardMetric>} */
        const stats = [
            {
                type: 'revenue',
                title: "Total Revenue",
                value: `$${(current.revenue / 100).toFixed(2)}`,
                change: `${revenueMetrics.change.toFixed(1)}%`,
                positive: revenueMetrics.positive
            },
            {
                type: 'orders',
                title: "Orders",
                value: current.orders.toString(),
                change: `${orderMetrics.change.toFixed(1)}%`,
                positive: orderMetrics.positive
            },
            {
                type: 'users',
                title: "Customers",
                value: current.users.toString(),
                change: `${userMetrics.change.toFixed(1)}%`,
                positive: userMetrics.positive
            },
            {
                type: 'products',
                title: "Active Products",
                value: productCount.toString(),
                change: "N/A",
                positive: true
            }
        ];

        return stats;
    } catch (error) {
        console.error('Error calculating dashboard stats:', error);
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
        const period = event.query?.period || 'month';
        const cacheKey = `${CACHE_KEY}_${period}`;
        
        // Use the cache utility with async data fetching
        const stats = await useCache(cacheKey, () => calculateStats(period), CACHE_DURATION);
        
        return {
            status: "good",
            statusCode: 200,
            message: "Dashboard statistics retrieved successfully",
            data: stats
        };
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        return {
            status: "bad",
            statusCode: 500,
            message: "Failed to retrieve dashboard statistics: " + error.message
        };
    }
}
