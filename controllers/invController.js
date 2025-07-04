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
    const classificationList = await utilities.buildClassificationList();

    res.render("./inventory/management", {
        title: "Inventory Management",
        nav,
        classificationList,    // Need to pass this to the EJS file to be rendered
        errors: null
    });
};

/* ***************************
 *  Build Add New Classification View
 * ************************** */
invCont.buildAddClassification = async function (req, res, next) {
    let nav = await utilities.getNav();
    const classifications = await invModel.getClassifications();

    res.render("./inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null,
        classification_name: "", // Initialize for sticky form
        classifications: classifications.rows,
    });
};

/* ***************************
 *  Process Adding a New Classification
 * ************************** */
invCont.processAddClassification = async function (req, res, next) {
    const { classification_name } = req.body;
    let nav = await utilities.getNav();

    const addResult = await invModel.addClassification(classification_name);

    if (addResult && addResult.rowCount > 0) { // Veryifying query was good
        // Since it got added I have to regenerate to nav to call and refresh again
        let updatedNav = await utilities.getNav(req, res);

        req.flash("success", `The classification "${classification_name}" was successfully added.`);
        // Rendering to the management view
        res.status(201).render("./inventory/management", {
            title: "Vehicle Management",
            nav: updatedNav,
            errors: null,
        });
    } else {
        // Failure to add
        req.flash("error", `Adding the classification "${classification_name}" failed. Please try again.`);
        res.status(501).render("./inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: { array: () => [{ msg: "Failed to add classification to the database." }] },
            classification_name,
        });
    }
};

/* ***************************
 *  Build Add New Inventory Item View
 * ************************** */
invCont.buildAddInventory = async function (req, res, next) {
    let nav = await utilities.getNav();
    let classificationList = await utilities.buildClassificationList();

    res.render("./inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        classificationList,
        errors: null,
        // Initialize fields for sticky form
        inv_make: "",
        inv_model: "",
        inv_year: "",
        inv_description: "",
        inv_image: "/images/vehicles/no-image.png", // Default value
        inv_thumbnail: "/images/vehicles/no-image-tn.png", // Default value
        inv_price: "",
        inv_miles: "",
        inv_color: "",
        classification_id: "",
    });
};

/* ***************************
 *  Process Adding a New Inventory Item
 * ************************** */
invCont.processAddInventory = async function (req, res, next) {
    const {
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_miles,
        inv_color,
        classification_id,
    } = req.body;

    let nav = await utilities.getNav();

    const addResult = await invModel.addInventoryItem(
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_image,
        inv_thumbnail,
        parseFloat(String(inv_price).replace(/,/g, '')), // Removing the commas
        parseInt(String(inv_miles).replace(/,/g, '')),   // Removing the commas
        inv_color,
        parseInt(classification_id) // It MUST be an int
    );

    if (addResult && addResult.rowCount > 0) {
        req.flash("success", `The vehicle "${inv_make} ${inv_model}" was successfully added to inventory.`);
        // Redirecting to management view or render it
        res.redirect("/inv/");
    } else {
        // Failled to add to the DB
        req.flash("error", `Adding "${inv_make} ${inv_model}" failed. Please try again.`);
        let classificationList = await utilities.buildClassificationList(classification_id);
        res.status(501).render("./inventory/add-inventory", {
            title: "Add New Inventory Item",
            nav,
            classificationList,
            errors: { array: () => [{ msg: "Failed to add vehicle to the database." }] }, //
            // Pass all fields back for sticky form on the error
            inv_make,
            inv_model,
            inv_year,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_miles,
            inv_color,
            classification_id,
        });
    }
};

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
}

/* ***************************
 *  Build Edit Inventory View
 * ************************** */
invCont.buildEditInventoryView = async function (req, res, next) {
    const inventory_id = parseInt(req.params.inventoryId);
    let nav = await utilities.getNav();
    const itemData = await invModel.getInventoryByInventoryId(inventory_id);

     // Adding for quality of life redirect in case someone manually adds invalid id.
    if (!itemData) {
        req.flash("error", "Sorry, the requested vehicle could not be found.");
        return res.redirect("/inv/");
    }

    const classificationList = await utilities.buildClassificationList(itemData.classification_id);
    const vehicleName = `${itemData.inv_make} ${itemData.inv_model}`;

    res.render("./inventory/edit-inventory", {
        title: "Edit " + vehicleName,
        nav,
        classificationList: classificationList,
        errors: null,
        inv_id: itemData.inv_id,
        inv_make: itemData.inv_make,
        inv_model: itemData.inv_model,
        inv_year: itemData.inv_year,
        inv_description: itemData.inv_description,
        inv_image: itemData.inv_image,
        inv_thumbnail: itemData.inv_thumbnail,
        inv_price: itemData.inv_price,
        inv_miles: itemData.inv_miles,
        inv_color: itemData.inv_color,
        classification_id: itemData.classification_id
    });
};

/* ***************************
 *  Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body
  const updateResult = await invModel.updateInventory(
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id
  )

  if (updateResult) {
    const itemName = updateResult.inv_make + " " + updateResult.inv_model
    req.flash("notice", `The ${itemName} was successfully updated.`)
    res.redirect("/inv/")
  } else {
    const classificationList = await utilities.buildClassificationList(classification_id)
    const itemName = `${inv_make} ${inv_model}`
    req.flash("notice", "Sorry, the insert failed.")
    res.status(501).render("inventory/edit-inventory", {
        title: "Edit " + itemName,
        nav,
        classificationList: classificationList,
        errors: null,
        inv_id,
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_miles,
        inv_color,
        classification_id
    })
  }
}

/* ***************************
 *  Build Delete Confirmation View
 * ************************** */
invCont.buildDeleteConfirmationView = async function (req, res, next) {
    const inventory_id = parseInt(req.params.inventoryId);
    let nav = await utilities.getNav();
    const itemData = await invModel.getInventoryByInventoryId(inventory_id);
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

    res.render("./inventory/delete-confirm", {
        title: "Delete " + itemName,
        nav,
        errors: null,
        inv_id: itemData.inv_id,
        inv_make: itemData.inv_make,
        inv_model: itemData.inv_model,
        inv_year: itemData.inv_year,
        inv_price: itemData.inv_price
    });
};

/* ***************************
 *  Process the Delete Request
 * ************************** */
invCont.processDelete = async function (req, res, next) {
    const inv_id = parseInt(req.body.inv_id);
    const deleteResult = await invModel.deleteInventoryItem(inv_id);

    if (deleteResult) {
        req.flash("notice", "The vehicle was successfully deleted from the inventory.");
        res.redirect("/inv/");  // Redirect back to management view
    } else {
        req.flash("notice", "Unfortunately, the deletion failed.");
        res.redirect(`/inv/delete/${inv_id}`);
    }
};

module.exports = invCont