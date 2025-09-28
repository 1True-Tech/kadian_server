/// <reference path="../../types/user.js" />

/**
 * 
 * @param {*} user 
 * @returns {UserData}
 */
export default function processUserData (user)  {
  return {
    addresses: user.addresses.map(a => ({
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      country: a.country,
      state: a.state,
      postal: a.postal,
      primary: a.primary,
      id: a.id,
    })),
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
