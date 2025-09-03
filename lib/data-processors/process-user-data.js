/// <reference path="../../types/user.js" />

/**
 * 
 * @param {*} user 
 * @returns {UserData}
 */
export default function processUserData (user)  {
  return {
    addresses: user.addresses,
    email: user.email,
    id: user._id.toString(),
    name: {
      first: user.name.first,
      last: user.name.last,
    },
    phone: user.phone,
    cart: user.cart,
    wishList: user.wishList,
    role: user.role || "user", // Default to 'user' if role is not set
  };
}
