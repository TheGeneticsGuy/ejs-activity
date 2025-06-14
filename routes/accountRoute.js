const express = require("express");
const router = new express.Router();
const accController = require("../controllers/accountController");
const utilities = require("../utilities/");

// Making a Details page
router.get("/account/login", utilities.handleErrors(accController.buildLogin));

module.exports = router;