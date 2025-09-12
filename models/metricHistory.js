import { Schema } from "mongoose";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";

/**
 * @typedef {Object} MetricHistory
 * @property {string} type - The type of metric (orders, revenue, users, products)
 * @property {number} value - The numeric value for this metric
 * @property {Date} timestamp - When this metric was recorded
 */

const metricHistorySchema = new Schema({
    type: {
        type: String,
        enum: ['orders', 'revenue', 'users', 'products'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for efficient queries
metricHistorySchema.index({ type: 1, timestamp: -1 });

const historyConn = getDbConnection("metrics");
const MetricHistory = historyConn.models.MetricHistory || historyConn.model("MetricHistory", metricHistorySchema);

export default MetricHistory;
