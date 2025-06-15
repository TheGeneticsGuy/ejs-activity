const express = require("express");
const router = new express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require('../utilities/account-validation')

// Making a login page
router.get("/login",utilities.handleErrors(accountController.buildLogin));

// Making a registration page
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to process registration
router.post('/register',
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

module.exports = router;