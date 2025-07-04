// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require('../utilities/inventory-validation');

router.get(
    "/",
    // utilities.checkLogin,
    utilities.handleErrors(invController.buildManagementView)
);

// GET  /inv/getInventory/:classification_id
router.get(
    "/getInventory/:classification_id",
    utilities.handleErrors(invController.getInventoryJSON)
);

// Classification route GET
router.get(
    "/add-classification",
    utilities.checkLogin,
    utilities.handleErrors(invController.buildAddClassification)
);

// Classification route POST to add new
router.post(
    "/add-classification",
    utilities.checkLogin,
    invValidate.addClassificationRules(),
    invValidate.checkClassificationData,
    utilities.handleErrors(invController.processAddClassification)
);

router.get(
    "/add-inventory",
    utilities.checkLogin,
    utilities.handleErrors(invController.buildAddInventory)
);

// POST Add New Inventory Item
router.post(
    "/add-inventory",
    utilities.checkLogin,
    invValidate.addInventoryRules(),
    invValidate.checkInventoryData,
    utilities.handleErrors(invController.processAddInventory)
);

// GET - Get Cars by Classification id
router.get("/type/:classificationId",
    utilities.handleErrors(invController.buildByClassificationId)
);

// GET - Making a Details page of the car by id
router.get("/detail/:inventoryId",
    utilities.handleErrors(invController.buildByInventoryId)
);

// GET - Edit an inventory item
// Route: /inv/edit/#
router.get("/edit/:inventoryId",
    utilities.checkLogin,   // Need to ensure permission if editing
    utilities.handleErrors(invController.buildEditInventoryView )
);

// POST - Process the updated Inventory item
router.post("/update",
    utilities.checkLogin,
    invValidate.addInventoryRules(),
    invValidate.checkUpdateData,    // Similar to CheckInvetoryData, but modified for update/edit
    utilities.handleErrors(invController.updateInventory)
);


module.exports = router;