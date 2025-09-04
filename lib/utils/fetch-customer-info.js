/// <reference path="../../types/order.js" />

import env from "../constants/env.js";

/**
 * Fetches customer information either from guest info or user profile
 * @param {boolean} isGuest - Whether the customer is a guest
 * @param {CustomerInfo} guestInfo - Guest customer information
 * @param {string} [authToken] - Authentication token for logged in users
 * @returns {Promise<CustomerInfo>} Customer information
 */
export default async function fetchCustomerInfo(isGuest, guestInfo, authToken) {
  if (isGuest) {
    // Immediate resolution for guests
    return guestInfo;
  }

  // Real user: fetch once
  const response = await fetch(`${env.baseUrl}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: authToken,
    }
  });
  
  const { data: user } = await response.json();
  
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  };
}