import deleteOrder from "./delete.js";
import permanentlyDeleteOrder from "./full.delete.js";
import getOrder from "./get.js";
import updateOrder from "./patch.js";

const orderItem = {
    deleteOrder,
    getOrder,
    updateOrder,
    permanentlyDeleteOrder
}

export default orderItem;