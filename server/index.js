const admin = require("firebase-admin");
const functions = require('firebase-functions');
const express = require('express');
const Order = require('./Order');
var groceryStores = {};

admin.initializeApp(functions.config().firebase);
var gsDB = admin.firestore();

// General request handler
var foodBankFunctions = express();

// Adds a handler for POST requests to '/foodBank/placeOrder'
foodBankFunctions.post('/placeOrder', (request, response) => {
    var body = request.body;
    //Create a new Order object
    const order = new Order(body);
    //ToDo something with the order here
    response.status(200).send("Order Received");
});

// Handles quesquests on '/foodBank'
exports.foodBank = functions.https.onRequest(foodBankFunctions);

var groceryStoreFunctions = express();

groceryStoreFunctions.post('/sendUser', (request, response) => {
    var userInfo = request.body;
    // TODO parse userInfo and register grocery store
    groceryStores[userInfo.storeId] = userInfo;
    
    response.status(200).send("Grocery Store Registered");
})

exports.groceryStore = functions.https.onRequest(groceryStoreFunctions)

function writeGroceryStoreData(storeId, companyName, location, storeNumber) {
    gsDB.ref('groceryStores/' + storeId).set({
    companyName: companyName,
    location: location,
    storeNumber: storeNumber
    });
}

function updateGroceryStoreData(storeId, companyName, location, storeNumber) {
    var update = {};
    var updatedInfo = {
        companyName: companyName,
        location: location,
        storeNumber: storeNumber
    }

    update['groceryStores/' + storeId] = updatedInfo;

    gsDB.ref().update(update);
}