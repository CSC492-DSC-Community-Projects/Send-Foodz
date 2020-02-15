const admin = require("firebase-admin");
const functions = require('firebase-functions');
const express = require('express');
const Order = require('./Order');
const OrderProcessor = require('./OrderProcessor');
const GroceryStoreService = require('./GroceryStoreService');
const EdiOrder = require('./EdiOrder');
const GroceryStoreDao = require('./GroceryStoreDao');
const FoodBankDao = require('./FoodBankDao');
const FoodBank = require('./FoodBank');

// Initialize App
admin.initializeApp(functions.config().firebase);
var gsDB = admin.firestore();
var groceryStores = {};
var driverQuery = gsDB.collection('driver');
var processor = new OrderProcessor(driverQuery);
var groceryStoreService = new GroceryStoreService(groceryStores);
var groceryStoreDao = new GroceryStoreDao(gsDB);
var foodBankDao = new FoodBankDao(gsDB);

/*******************Food Bank EndPoint *************************/
const app = express();

app.post('/foodBank/placeOrder', (request, response) => {
    var body = request.body;
    order = new Order(body);
    if (processor.processOrder(order,  groceryStoreService)) {
        response.status(200).send("Order Received");
    }
    //write to firestore database
});

app.post('/foodBank/updateUserAccount', (request, response) => {
    var body = request.body;
    var foodBankModel = new FoodBank(body);
    foodBankDao.writeFoodBankData(1, foodBankModel.getFoodBankName(), foodBankModel.getFoodBankLocation(), foodBankModel.getFoodBankLocationId());
    
    //write to firestore database
});
/*****************Grocery Store EndPoint **********************/

app.post('/groceryStore/sendUser', (request, response) => {
    var userInfo = request.body;
    //TODO parse userInfo and register grocery store
    groceryStores[userInfo.storeId] = userInfo; 
    response.status(200).send("Grocery Store Registered");
});

//Update inventory of a store
app.post('/groceryStore/inventoryUpdate',(request, response) =>{
    //receive data body that is an inventory from single grocery store
    var jsonBody = request.body; 
    var newEdiOrder = new EdiOrder(jsonBody);
    groceryStoreDao.newInventoryToGroceryStoreData(newEdiOrder);
    response.status(200).send("Inventory updated in Firestore");
});

// //verify order has been picked up 
// groceryStoreFunctions.post('/orderPickedUp/:orderId', (request, response) =>{
//     var tempOrder = processor.getOrder(request.orderId);
// });

/*****************Grocery Store EndPoint **********************/

app.post('/driver/driverStatusUpdate', (request, response) => {
    var orderId = request.body.orderId;
    var driverId = request.body.driverId;
    var updateDriverStatus = request.body.updateDriverStatus;
    
    response.status(200).send("Driver Id: " + driverId + 
                                "\n New Status: " + updateDriverStatus +
                                "\n For Order Id: " + orderId);
});

exports.app = functions.https.onRequest(app);
