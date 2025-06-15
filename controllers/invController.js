const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classification_id);

    const grid = await utilities.buildClassificationGrid(data);

    let nav = await utilities.getNav()
    const className = data[0].classification_name
    res.render("./inventory/classification", {
        title: className + " vehicles",
        nav,
        grid,
    })
}

/* ***************************
 *  Build inventory item detail view
 *  Example: /inv/detail/5
 * ************************** */
invCont.buildByInventoryId = async function (req, res, next) {
    const inventory_id = req.params.inventoryId;
    const itemData = await invModel.getInventoryByInventoryId(inventory_id);

    const detailViewHtml = await utilities.buildInventoryDetailView(itemData);
    let nav = await utilities.getNav();
    const vehicleName = `${itemData.inv_make} ${itemData.inv_model}`;

    res.render("./inventory/detail", {
        title: vehicleName,
        nav,
        detailContent: detailViewHtml,
    });
}

/* ***************************
 *  Build Inventory Management View
 *  Accessed via GET /inv/
 * ************************** */
invCont.buildManagementView = async function (req, res, next) {
    let nav = await utilities.getNav();

    if (!req.session.loggedin) { // Example protection
       req.flash("notice", "Please log in to access vehicle management.");
       return res.redirect("/account/login");
    }
    // Add further checks for account_type (e.g., 'Admin', 'Employee') from req.session.accountData

    res.render("./inventory/management", {
        title: "Vehicle Management",
        nav,
        errors: null,
    });
};


module.exports = invCont