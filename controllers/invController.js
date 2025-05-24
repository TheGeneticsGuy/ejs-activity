const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    const grid = await utilities.buildClassificationGrid(data)
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

    if (!itemData) {
        const err = new Error("Vehicle not found.");
        err.status = 404;
        return next(err); // This is so the global error handler in server.js can handle it for my 404 page we made
    }

    const detailViewHtml = await utilities.buildInventoryDetailView(itemData); // You'll create this utility function
    let nav = await utilities.getNav();
    const vehicleName = `${itemData.inv_make} ${itemData.inv_model}`;

    res.render("./inventory/detail", { // You'll create this EJS template
        title: vehicleName, // For the <title> tag and potentially an <h1> in layout
        nav,
        detailContent: detailViewHtml, // The main HTML content for the detail view
        errors: null,
    });
}

module.exports = invCont