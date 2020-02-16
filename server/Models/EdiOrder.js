const Item = require("./Item");
class EdiOrder {
    constructor(ediOrder) {
        this.ediOrderNumber = ediOrder.ediOrderNumber;
        this.groceryId = ediOrder.groceryId;
        this.inventoryItems = {};
        this.parseItems(ediOrder.inventoryItems)
    }

    parseItems(inventoryItemsRef) {
        for (const [itemId, item] of Object.entries(inventoryItemsRef)) {
            this.inventoryItems[itemId] = new Item.Item(item, this.ediOrderNumber);
        }
    }

    getGroceryId() {
        return this.groceryId;
    }
}

module.exports = {
    EdiOrder
};