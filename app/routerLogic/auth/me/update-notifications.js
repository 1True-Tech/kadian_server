import User from "../../../../models/user.js";

/**
 * Update user notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with success or error message
 */
const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationSettings = req.body;

    // Validate input
    if (!notificationSettings) {
      return res.status(400).json({ message: 'Notification settings are required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    user.notificationPreferences = {
      ...user.notificationPreferences || {},
      ...notificationSettings
    };
    
    await user.save();

    return res.status(200).json({ 
      message: 'Notification settings updated successfully',
      notificationPreferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default updateNotifications;