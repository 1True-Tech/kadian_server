/// <reference path="../../types/order.js" />


/**
 * Fetches customer information either from guest info or user profile
 * @param {boolean} isGuest - Whether the customer is a guest
 * @param {CustomerInfo} guestInfo - Guest customer information
 * @param {string} [authToken] - Authentication token for logged in users
 * @param {string} [baseUrl] - Base URL for API requests
 * @returns {Promise<CustomerInfo>} Customer information
 */
export default async function fetchCustomerInfo(isGuest, guestInfo, authToken, baseUrl) {
  if (isGuest) {
    // Immediate resolution for guests
    return guestInfo;
  }

  // Real user: fetch once
  const response = await fetch(`${baseUrl}/auth/me`, {
    method: "GET",
    headers: {
      authorization: authToken,
    }
  });
  
  const { data: user } = await response.json();
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  };
}