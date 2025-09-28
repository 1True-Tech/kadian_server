import removeAddress from "./delete.js";
import get from "./get.js";
import patch from "./patch.js";
import post from "./post.js";

const address = {
    get,
    post,
    patch,
    "delete": removeAddress
}

export default address