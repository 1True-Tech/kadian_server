import inventoryItem from "./[productId]/index.js";
import refreshInventory from "./_refresh.js";
import get from "./get.js";

const inventory = {
    get,
    refreshInventory,
    inventoryItem
}

export default inventory