/* Order is observer of: Inventory
 *           observed by: Drivers
 */

export class Order {

    constructor(orderRef) {
        this.orderId = orderRef.orderId
        this.progressStatus = orderRef.status;
        this.foodBankId = orderRef.foodBankId;
        this.groceryId = orderRef.groceryId;
        this.inventoryItems = {};
        this.timePlaced = Date(orderRef.time);

        this.driverId = {};

        this.parseItems(orderRef.inventoryItems);
    }

    setProgressStatus(newStatus) {
        this.progressStatus = newStatus;
    }

    getProgressStatus() {
        return this.progressStatus;
    }

    getDriver(driverId) {
        return this.driverId[driverId];
    }

    setFoodBankId(foodBankId) {
        this.foodBankId = foodBankId;
    }

    getFoodBankId() {
        return this.foodBankId;
    }

    setGroceryId(groceryId) {
        this.groceryId = groceryId;
    }

    getGroceryId() {
        return this.groceryId;
    }

    setTime(time) {
        this.timePlaced = time;
    }

    getTime() {
        return this.timePlaced;
    }

    getItem(itemId) {
        return this.inventoryItems[itemId];
    }

    parseItems(itemsList) { // who parses itemsJSON into Items?
        itemsList.forEach( item => {
            this.inventoryItems[item.name] = item
        });
    }

    // Beginning of Observable's duties
    notifyFoodBank(foodBankURL) {
        try {
            let fbServer = new XMLHttpRequest();
            fbServer.open("POST", foodBankURL, true);
            fbServer.setRequestHeader('Content-Type', 'application/json');
            fbServer.send(JSON.stringify({
                "orderId": this.orderId,
                "status": this.progressStatus
            }))

            fbServer.onreadystatechange = function () {
                if (this.status === 200) {
                    console.log("200");
                }
            }

            fbServer.send();

        } catch (error) {
            console.log("Can't notify entity.")
        }
    }

    notifyGroceryStore(groceryStoreURL) {
        try {
            let gsServer = new XMLHttpRequest();
            gsServer.open("POST", groceryStoreURL, true);
            gsServer.setRequestHeader('Content-Type', 'application/json');
            gsServer.send(JSON.stringify({
                "orderId": this.orderId,
                "status": this.progressStatus
            }))

            gsServer.onreadystatechange = function () {
                if (this.status === 200) {
                    console.log("200");
                }
            }

            gsServer.send();
        } catch (error) {
            console.log("Can't notify entity.")
        }
    }
    

    notifyDrivers(context) { // push notification
        if (this.driverId.length !== 0) {
            this.driverId.forEach(driver => {
                driver.messages = context;
            });
            console.log('Driver notified with ' + context);
        } else {
            console.log("Notification failed" + error);
        }
    }

    addDriver(driver) { // adds observer
        try {
            if (this.isDriverValid(driver)) {
                this.driverId[driver.orderId] = driver;
                console.log("Driver added.");
            }
        } catch (error) {
            console.log("Can't assign driver" + error);
        }

    }

    removeDriver(driverId) { // remove observer
        try {
            delete this.driverId[driverId];
            console.log("Driver" + driverId + " removed.");
        } catch (error) {
            console.log("Can't unsubscribe driver " + error);
        }
    }

    isDriverValid(driver) {
        //check if Driver instance has ID, name, reg. vehicle

        return ((driver.id !== null) && driver.name !== undefined && driver.vehicle !== undefined);
    }
    // End of Observable duties

    // Beginning of Observer duties
    updateStatus(newStatus) {
        // update properties in response to changes in Inventory
        order.setProgressStatus(newStatus);
    }   

    // End of Observer duties
}

