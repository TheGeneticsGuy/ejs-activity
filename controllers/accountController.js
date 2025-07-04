const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
* Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
    if (res.locals.loggedin) {
        return res.redirect("/account/");
    }
    let nav = await utilities.getNav();
    res.render("account/login", {
        title: "Login",
        nav,
        errors: null
    });
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  if (res.locals.loggedin) {
        return res.redirect("/account/");
    }
  let nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null
  })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing the registration.')
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
    return;
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  if (regResult && regResult.rowCount && regResult.rowCount > 0) {  // I added these row checks as validation it got added
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null
    })
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })

      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }

      return res.redirect("/account/")
    }
    else {
      req.flash("message notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

/* ****************************************
*  Build Account Profile View
* *************************************** */
async function buildProfileView(req, res, next) {
    let nav = await utilities.getNav();
    const accountData = res.locals.accountData;

    if (!accountData) {
        // Techynically won't happen with the checkLogin middleware, but maybe multi-tab concurrency protection
        req.flash("notice", "User data not found. Please log in again.");
        return res.redirect("/account/login");
    }

    res.render("account/profile", {
        title: "My Profile",
        nav,
        errors: null,
        account_firstname: accountData.account_firstname, // Pass the first name to the view for msg
        account_type: accountData.account_type  // In case we want to pass admin status
    });
}

/* ****************************************
*  Build Account Management View
* *************************************** */
async function buildAccountManagementView(req, res, next) {
    let nav = await utilities.getNav();
    const accountData = res.locals.accountData;

    res.render("account/management", {
        title: "Account Management",
        nav,
        errors: null,
        account_firstname: accountData.account_firstname,
        account_type: accountData.account_type
    });
}

/* ****************************************
*  Build Account Update View
* *************************************** */
async function buildUpdateAccountView(req, res, next) {
    let nav = await utilities.getNav();
    const account_id = parseInt(req.params.accountId);
    const accountData = await accountModel.getAccountById(account_id);

    res.render("account/update", {
        title: "Edit Account",
        nav,
        errors: null,
        account_id: accountData.account_id,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
    });
}

/* ****************************************
*  Process Account Info Update
* *************************************** */
async function updateAccountInfo(req, res, next) {
    let nav = await utilities.getNav();
    const { account_id, account_firstname, account_lastname, account_email } = req.body;

    const updateResult = await accountModel.updateAccount(
        account_id,
        account_firstname,
        account_lastname,
        account_email
    );

    if (updateResult) {
        try {
            // Grab the updated data
            const updatedAccountData = await accountModel.getAccountById(account_id);
            // Re-sign-in to get new token
            const accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });

            if (process.env.NODE_ENV === 'development') {
                res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 });
            } else {
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 });
            }
        } catch (error) {
            // Just in case the token signing fails for some reason, let's just keep going since technically it's just visual QOL.
            console.error("Error re-signing token after update:", error);
        }

        req.flash("notice", "Your account information has been successfully updated.");
        res.redirect("/account/");

    } else {
        req.flash("notice", "Sorry, the update failed.");
        res.status(501).render("account/update", {
            title: "Edit Account",
            nav,
            errors: null,
            account_id,
            account_firstname,
            account_lastname,
            account_email,
        });
    }
  }

/* ****************************************
*  Process Password Change
* *************************************** */
async function changePassword(req, res, next) {
    let nav = await utilities.getNav();
    const { account_id, account_password } = req.body;

    let hashedPassword;
    try {
        hashedPassword = bcrypt.hashSync(account_password, 10);
    } catch (error) {
        req.flash("notice", "Unfortunately, there was an error processing the password change.");
        return res.redirect(`/account/update/${account_id}`);
    }

    const updateResult = await accountModel.updatePassword(account_id, hashedPassword);

    if (updateResult) {
        req.flash("notice", "Your password has been successfully changed. Please log in again with the new password.");
        res.clearCookie("jwt");
        res.redirect("/account/login");
    } else {
        req.flash("notice", "Sorry, the password update failed.");
        res.redirect(`/account/update/${account_id}`);
    }
}

/* ****************************************
*  Process Logout
* *************************************** */
async function logoutAccount(req, res, next) {
    res.clearCookie('jwt')
    res.clearCookie('sessionId')
    req.flash("notice", "You have been logged out successfully.");

    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Error ending session:", err);
            }
            return res.redirect('/'); // Back to homepage
        });
    } else {
        res.redirect('/');
    }
}

module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin,
    buildProfileView,
    buildAccountManagementView,
    logoutAccount,
    buildUpdateAccountView,
    updateAccountInfo,
    changePassword
};