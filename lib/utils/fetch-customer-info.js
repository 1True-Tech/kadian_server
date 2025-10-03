/// <reference path="../../types/order.js" />

import User from "../../models/user.js";
import processUserData from "../data-processors/process-user-data.js";


/**
 * Fetches customer information either from guest info or user profile
 * @param {boolean} isGuest - Whether the customer is a guest
 * @param {CustomerInfo} guestInfo - Guest customer information
 * @param {string} [authToken] - Authentication token for logged in users
 * @param {string} [baseUrl] - Base URL for API requests
 * @returns {Promise<CustomerInfo>} Customer information
 */
export default async function fetchCustomerInfo(isGuest, guestInfo, userId) {
  if (isGuest) {
    // Immediate resolution for guests
    return guestInfo;
  }

  // Real user: fetch once
  const user = User.findById(userId);
  if(!user){
    throw Error("user not found")
  }
  // if response is array, pick first
  const userData = processUserData(user);
  return {
    name: userData.name,
    email: userData.email,
    phone: userData.phone || "",
  };
}