/* eslint-disable promise/always-return */
// Firebase Imports
const admin = require("firebase-admin");
const functions = require("firebase-functions");
// Endpoint Imports
const express = require("express")
const cors = require('cors');
const app = express();
app.use(cors());

//Services Imports
const UniqueIdService = require("./Services/UniqueIdService");
const OrderProcessor = require("./Services/OrderProcessor");
const FoodBankService = require("./Services/FoodBankService");
const DriverService = require("./Services/DriverService");
const GroceryStoreService = require("./Services/GroceryStoreService");

//Daos Imports
const FoodBankDao = require('./DataAccessObjects/FoodBankDao');
const DriverDao = require("./DataAccessObjects/DriverDao");
const GroceryStoreDao = require("./DataAccessObjects/GroceryStoreDao");
const OrderDao = require("./DataAccessObjects/OrderDao");

// Initialize App
admin.initializeApp(functions.config().firebase);
var DB = admin.firestore();

//Initialize Daos
var orderDao = new OrderDao.OrderDao(DB);
var groceryStoreDao = new GroceryStoreDao.GroceryStoreDao(DB);
var driverDao = new DriverDao.DriverDao(DB);
var foodBankDao = new FoodBankDao.FoodBankDao(DB);

//Initialize Services
var uniqueIdService = new UniqueIdService.UniqueIdService(DB);
var foodBankService = new FoodBankService.FoodBankService(foodBankDao, uniqueIdService);
var driverService = new DriverService.DriverService(DB, driverDao, uniqueIdService, orderDao);
var groceryStoreService = new GroceryStoreService.GroceryStoreService(DB, groceryStoreDao, uniqueIdService);
var orderProcessor = new OrderProcessor.OrderProcessor(DB, orderDao, groceryStoreDao, driverDao, foodBankDao, uniqueIdService);



exports.pruneDaily = functions.pubsub.schedule('0 0 * * *').onRun((context) => {
    groceryStoreDao.pruneInventory();
    return null;
});
/*******************Order EndPoint *************************/
app.post("/order/statusUpdate", async(request, response) => {
    try {
        await orderProcessor.updateActiveOrderStatus(request.body.id, request.body.status);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Order " + request.body.id + " New Status: " + request.body.status);

});



/*******************Food Bank EndPoint *************************/
app.post("/foodBank/placeOrder", async(request, response) => {
    try {
        var order = await orderProcessor.createOrder(request.body);
        await orderProcessor.processOrder(order);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Order Id " + order.getId() + " status is " + order.getStatus());
});

app.post('/foodBank/updateUserAccount',  async (request, response) => {
    try {
        var foodBank = await foodBankService.createFoodBank(request.body);
        foodBankService.updateFoodBankAccount(foodBank);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Food Bank " + foodBank.getId() + " Account Updated");
});

/*****************Grocery Store EndPoint **********************/
app.post("/groceryStore/updateUserAccount", async (request, response) => {
    try {
        var groceryStore = await groceryStoreService.createGroceryStore(request.body);
        groceryStoreService.updateGroceryStoreAccount(groceryStore);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Grocery Store " + groceryStore.getId() + " Account Updated");
});

app.post("/groceryStore/updateInventory", async (request, response) => {
    try {
        var ediOrder = await groceryStoreService.createEDIOrder(request.body);
        groceryStoreService.updateInventory(ediOrder);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Grocery Store " + ediOrder.getGroceryStoreId() + " Inventory Updated");
});

/*****************Driver EndPoint **********************/

app.post("/driver/statusUpdate", async (request, response) => {
    try {
        await driverService.updateDriverStatus(request.body.id, request.body.status);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Driver " + request.body.id + " New Status: " + request.body.status);

});

app.post("/driver/updateUserAccount", async (request, response) => {
    try {
        var driver = await driverService.createDriver(request.body, false);
        driverService.updateDriverAccount(driver);
    }
    catch (e) {
        response.status(202).send(e.message)
        return
    }
    response.status(200).send("Driver " + driver.getId() + " Account Updated");
});

exports.app = functions.https.onRequest(app);