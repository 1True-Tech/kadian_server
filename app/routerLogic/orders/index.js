import orderItem from "./[id]/index.js";
import { getByUser } from "./by-user.get.js";
import { get } from "./get.js";
import { post } from "./post.js";

const orders = {
    get,
    post,
    getByUser,
    orderItem
}

export default orders;