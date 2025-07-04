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
router.post("/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Process the login attempt
router.post( "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// For Profile page  -  /account/profile
router.get("/profile",
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildProfileView)
);

// For Account Management View
router.get("/",
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildAccountManagementView)
);

// GET route to build the account update view
router.get("/update/:accountId",
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildUpdateAccountView)
);

// POST route to handle account info update
router.post("/update",
    utilities.checkLogin,
    regValidate.updateAccountRules(),
    utilities.handleErrors(accountController.updateAccountInfo)
);

// POST route to handle password change
router.post("/change-password",
    utilities.checkLogin,
    regValidate.changePasswordRules(),
    regValidate.checkPasswordData,
    utilities.handleErrors(accountController.changePassword)
);

// Route for Logout
router.get("/logout", accountController.logoutAccount);

module.exports = router;