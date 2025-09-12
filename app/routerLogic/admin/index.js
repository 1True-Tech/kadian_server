// Import admin route handlers
import { getDashboardStats } from "./dashboard.js";

// Combine all admin routes
const admin = {
  // Dashboard routes
  dashboard: {
    getStats: getDashboardStats,
  },
};

export default admin;
