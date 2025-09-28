/**
 * User roles definition
 * @typedef {"admin"|"user" | "superadmin"} UserRole
 */

const d = {
    line1: a.line1,
      line2: a.line2,
      city: a.city,
      country: a.country,
      state: a.state,
      postal: a.postal,
      primary: a.primary,
      id: a.id,
}
/**
 * Address type definition
 * @typedef {Object} Address
 * @property {string} line1 - address 1
 * @property {string} line2 - address 2
 * @property {string} city - city or province
 * @property {string} country - country name
 * @property {string} state - state
 * @property {string} postal - postal code or zipcode
 * @property {string} primary - is primary address
 * @property {string} id - id
 */

/**
 * Cart item type definition
 * @typedef {Object} CartItem
 * @property {string} productId - Sanity product ID
 * @property {Date} addedAt - Date when item was added to cart
 * @property {Date} updatedAt - Date when cart item was last updated
 * @property {number} quantity - Number of items
 * @property {string} variantSku - Product variant SKU
 * @property {number} price - Item price
 */

/**
 * Wishlist item type definition
 * @typedef {Object} WishlistItem
 * @property {string} productId - Sanity product ID
 */

/**
 * Name type definition
 * @typedef {Object} Name
 * @property {string} first - First name (1-50 characters)
 * @property {string} last - Last name (1-50 characters)
 */

/**
 * User data type definition
 * @typedef {Object} UserData
 * @property {string} email - User's email address (must match email format)
 * @property {string} password - Hashed password (min 8 chars, must include uppercase, number, and symbol)
 * @property {Name} name - User's full name
 * @property {string} [phone] - Phone number in E.164 format (optional)
 * @property {Address[]} addresses - List of user addresses
 * @property {CartItem[]} cart - User's shopping cart items
 * @property {WishlistItem[]} wishList - User's wishlist items
 * @property {UserRole} role - User's role ("user" or "admin")
 * @property {string} [resetPasswordTokenHash] - Hashed reset password token (optional)
 * @property {Date} [resetPasswordExpires] - Reset token expiration date (optional)
 * @property {number} loginAttempts - Number of failed login attempts
 * @property {number} [lockUntil] - Account lock expiration timestamp
 * @property {string} _id - MongoDB document ID
 */

