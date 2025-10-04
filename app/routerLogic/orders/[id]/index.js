import deleteOrder from "./delete.js";
import permanentlyDeleteOrder from "./full.delete.js";
import getOrder from "./get.js";
import updateOrder from "./patch.js";
import { paymentPatch } from "./payment.js";

const orderItem = {
    deleteOrder,
    getOrder,
    updateOrder,
    permanentlyDeleteOrder,
    updatePayment: paymentPatch
}

export default orderItem;