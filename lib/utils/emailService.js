import env from '../constants/env.js';




/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} - Email sending result
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
  try {    

    const res = await fetch(`${env.CLIENT_URL}/services/emailservice?type=password-reset-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, resetUrl }),
    })

    if(!res.ok){
      return {
        success: false, message: `Failed to send email: ${res.statusText}`,
        statusCode: res.status
      }
    }

    const data = await res.json();
    
    return { ...data};
    
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} templateName - Template name to use
 * @param {Object} data - Data for the template
 * @returns {Promise<Object>} - Email sending result
 */
export const sendNotificationEmail = async (to, subject, templateName, data) => {
  try {
    const res = await fetch(`${env.CLIENT_URL}/services/emailservicetype=notification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateName, data,to, subject }),
    })

    if(!res.ok){
      return {
        success: false, message: `Failed to send email: ${res.statusText}`,
        statusCode: res.status
      }
    }

    const data = await res.json();
    
    return { ...data};
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPasswordResetEmail,
  sendNotificationEmail
};