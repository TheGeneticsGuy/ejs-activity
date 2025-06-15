// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
// const invValidate = require('../utilities/inventory-validation');

router.get(
    "/",
    utilities.checkLogin,
    utilities.handleErrors(invController.buildManagementView)
);

router.get("/type/:classificationId",
    utilities.handleErrors(invController.buildByClassificationId)
);

// Making a Details page
router.get("/detail/:inventoryId",
    utilities.handleErrors(invController.buildByInventoryId)
);

module.exports = router;