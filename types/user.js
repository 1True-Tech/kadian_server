/**
 * User roles definition
 * @typedef {"admin"|"user"} UserRole
 */

/**
 * Address type definition
 * @typedef {Object} Address
 * @property {string} street - Street address
 * @property {string} city - City name
 * @property {string} state - State or province
 * @property {string} postalCode - Postal/ZIP code
 * @property {string} country - Country name
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

