import address from "./address/index.js";
import cart from "./cart/index.js";
import myInfoDelete from "./myInfo.delete.js";
import myInfo from "./myInfo.js";
import myInfoPatch from "./myInfo.patch.js";
import wishlist from "./wishlist/index.js";

const me = {
  myInfo,
  myInfoDelete,
  myInfoPatch,
  cart,
  wishlist,
  address
};

export default me;
