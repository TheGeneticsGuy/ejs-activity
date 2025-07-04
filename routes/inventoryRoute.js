// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require('../utilities/inventory-validation');

router.get(
    "/",
    utilities.checkLogin,
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
    utilities.checkAccountType,
    utilities.handleErrors(invController.buildAddClassification)
);

// Classification route POST to add new
router.post(
    "/add-classification",
    utilities.checkLogin,
    utilities.checkAccountType,
    invValidate.addClassificationRules(),
    invValidate.checkClassificationData,
    utilities.handleErrors(invController.processAddClassification)
);

router.get(
    "/add-inventory",
    utilities.checkLogin,
    utilities.checkAccountType,
    utilities.handleErrors(invController.buildAddInventory)
);

// POST Add New Inventory Item
router.post(
    "/add-inventory",
    utilities.checkLogin,
    utilities.checkAccountType,
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
    utilities.checkLogin,
    utilities.checkAccountType,
    utilities.handleErrors(invController.buildEditInventoryView )
);

// POST - Process the updated Inventory item
// Route: /inv/update
router.post("/update",
    utilities.checkLogin,
    utilities.checkAccountType,
    invValidate.addInventoryRules(),
    invValidate.checkUpdateData,    // Similar to CheckInvetoryData, but modified for update/edit
    utilities.handleErrors(invController.updateInventory)
);


// GET - Build the delete confirmation view
// Route: /inv/delete/:inventoryId
router.get("/delete/:inventoryId",
    utilities.checkLogin,
    utilities.checkAccountType,
    utilities.handleErrors(invController.buildDeleteConfirmationView)
);

// POST - Process the delete request
// Route: /inv/delete
router.post("/delete",
    utilities.checkLogin,
    utilities.checkAccountType,
    utilities.handleErrors(invController.processDelete)
);

module.exports = router;