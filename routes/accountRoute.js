const express = require("express");
const router = new express.Router();
const accController = require("../controllers/accountController");
const utilities = require("../utilities/");

// Making a login page
router.get("/login", utilities.handleErrors(accController.buildLogin));

// Making a registration page
router.get("/register", utilities.handleErrors(accController.buildRegister));

module.exports = router;