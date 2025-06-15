const express = require("express");
const router = new express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");

// Making a login page
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Making a registration page
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to process registration
router.post('/register', utilities.handleErrors(accountController.registerAccount))

module.exports = router;