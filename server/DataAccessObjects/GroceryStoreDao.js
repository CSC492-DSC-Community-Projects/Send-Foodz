const Order = require("../Models/Order");
const FieldValue = require("firebase-admin").firestore.FieldValue;
class GroceryStoreDao {
    constructor(gsDB) {
        this.gsDB = gsDB;
    }

    isOrderValid(order) {
        var orderInventory = order.inventoryItems;
        let gsRef = this.gsDB.collection("GroceryStores").doc(order.groceryId).collection("InventoryCollection").doc("Items");
        return gsRef.get().then(groceryStoreInventory => {
            for (const [itemId, item] of Object.entries(orderInventory)) {
                if (item.getQuantity() > Number(groceryStoreInventory.data()[itemId]["quantity"])) {
                    order.setStatus(Order.OrderStates.INVALID);
                    return false;
                }
            }
            order.setStatus(Order.OrderStates.LOOKING_FOR_DRIVER);
            console.log(order.getStatus())
            this.updateStoreInventoryQuantity(gsRef, orderInventory, groceryStoreInventory.data());
            return true;

        });
    }

    updateStoreInventoryQuantity(gsRef, orderInventory, groceryStoreInventory) {
        var updateItems = {};
        for (const [itemId, item] of Object.entries(orderInventory)) {
            var remainingQuantity = Number(groceryStoreInventory[itemId]["quantity"]) - item.getQuantity();
            updateItems[orderInventory[itemId].getInventoryItemId()] = {
                "ediOrderNumber": orderInventory[itemId].getEdiOrderNumber(), "expiryDate": orderInventory[itemId].getExpiryDate(),
                "inventoryItemId": orderInventory[itemId].getInventoryItemId(), "name": orderInventory[itemId].getName(), "quantity": remainingQuantity
            };
        }
        gsRef.update(updateItems);
    }

    newInventoryToGroceryStoreData(newEdiOrder) {
        if (newEdiOrder.inventoryItems === undefined || newEdiOrder.inventoryItems.length === 0) {
            return null;
        }
        var stringInventoryData = JSON.stringify(newEdiOrder.inventoryItems);
        var json_inventory = JSON.parse(stringInventoryData);
        var keyRef = this.gsDB.collection("GroceryStores").doc(newEdiOrder.groceryId).set({ tmp: 0 });
        var myKeyRef = this.gsDB.collection("GroceryStores").doc(newEdiOrder.groceryId).collection("InventoryCollection").doc("Items");
        myKeyRef.set(json_inventory,
            { merge: true });
        return this.gsDB.collection("GroceryStores").doc(newEdiOrder.groceryId).update({ tmp: FieldValue.delete() }).then(check => {
            return true;
        }).catch(err => {
            console.log("Could not delete field", err);
            return false;
        });
    }

    writeGroceryStoreData(companyName, location, storeNumber) {
        var storeId = this.generateUniqueKey();
        this.gsDB.collection("GroceryStores").doc(`${storeId}`).set({
            companyName: companyName,
            location: location,
            storeNumber: storeNumber
        },
            { merge: true });
    }

    updateGroceryStoreData(storeID, productID, newquantity) {
        data = {}
        data[storeID + "." + productID] = newquantity
        this.gsDB.collection('GroceryStores').doc(`${storeID}`).collection('InventoryCollection').doc('Items').update(data);
    }

    generateUniqueKey() {
        let dbKeys = [];

        //get all keys in firebase and check they don"t coincide with key
        let ordersRef = this.gsDB.collection("GroceryStores");

        ordersRef.get().then(snapshot => {
            snapshot.forEach(doc => {
                dbKeys.push(doc.id);
            });
        })
            .catch(err => {
                console.log("Error getting documents", err);
            });

        return this._getKeyUnique(dbKeys);
    }

    _getKeyUnique(listOfKeys) {
        //return key if unique; otherwise recurse
        let key = Math.ceil(Math.random() * (10000));

        if (listOfKeys.includes(key)) {
            return this._getKeyUnique(listOfKeys);
        } else {
            return key;
        }
    }
}
module.exports = {
    GroceryStoreDao
};