import address from "./address/index.js";
import cart from "./cart/index.js";
import myInfoDelete from "./myInfo.delete.js";
import myInfo from "./myInfo.js";
import myInfoPatch from "./myInfo.patch.js";
import wishlist from "./wishlist/index.js";
import updateNotifications from "./update-notifications.js";
import changePassword from "../change-password.js";

const me = {
  myInfo,
  myInfoDelete,
  myInfoPatch,
  cart,
  wishlist,
  address,
  updateNotifications,
  changePassword
};

export default me;
