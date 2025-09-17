// Import admin route handlers
import { getDashboardStats } from "./dashboard.js";
import { getAllUsers, updateUserRole, deleteUser, getUserDetails } from "./users.js";

// Combine all admin routes
const admin = {
  // Dashboard routes
  dashboard: {
    getStats: getDashboardStats,
  },
  // User management routes
  users: {
    list: getAllUsers,
    getDetails: getUserDetails,
    updateRole: updateUserRole,
    delete: deleteUser,
  },
};

export default admin;
