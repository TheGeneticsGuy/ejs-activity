const invModel = require("../models/inventory-model")
const Util = {}
const jwt = require("jsonwebtoken")
const messageModel = require("../models/message-model");

require("dotenv").config()

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
    let data = await invModel.getClassifications()
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
        list += "<li>"
        list +=
            '<a href="/inv/type/' +
            row.classification_id +
            '" title="See our inventory of ' +
            row.classification_name +
            ' vehicles">' +
            row.classification_name +
            "</a>"
        list += "</li>"
    })
    list += "</ul>"
    return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function (data) {
    let grid
    if (data.length > 0) {
        grid = '<ul id="inv-display">'
        data.forEach(vehicle => {
            grid += '<li>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id
                + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model
                + 'details"><img src="' + vehicle.inv_thumbnail
                + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model
                + ' on CSE Motors" /></a>'
            grid += '<div class="namePrice">'
            grid += '<h2>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id + '" title="View '
                + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">'
                + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
            grid += '</h2>'
            grid += '<span>$'
                + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
            grid += '</div>'
            grid += '</li>'
        })
        grid += '</ul>'
    } else {
        grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

/* **************************************
* Build the inventory item detail view HTML
* ************************************ */
Util.buildInventoryDetailView = async function (itemData) {
    if (!itemData) {
        return '<p class="notice">Sorry, details for this vehicle could not be found.</p>';
    }

    // Formatting price and mileage

    const price = parseFloat(itemData.inv_price);
    const miles = typeof itemData.inv_miles === 'number' ? itemData.inv_miles : 0;

    const formattedPrice = new Intl.NumberFormat('en-US').format(price);
    const formattedMileage = new Intl.NumberFormat('en-US').format(miles);

    // Rest of the fields like inv_make, inv_model, inv_year, inv_color, inv_description
    let html = `
        <div id="vehicle-detail-container">
            <div class="vehicle-image-section">
                <img src="${itemData.inv_image}" alt="Image of ${itemData.inv_make} ${itemData.inv_model}">
            </div>
            <div class="vehicle-info-section">
                <h1>${itemData.inv_make} ${itemData.inv_model}</h1>
                <p class="vehicle-year"><strong>Year:</strong> ${itemData.inv_year}</p>
                <p class="vehicle-price"><strong>Price:</strong> $${formattedPrice}</p>
                <p class="vehicle-description"><strong>Description:</strong> ${itemData.inv_description}</p>
                <hr>
                <p class="vehicle-mileage"><strong>Mileage:</strong> ${formattedMileage} miles</p>
                <p class="vehicle-color"><strong>Color:</strong> ${itemData.inv_color}</p>
                <!-- Add other details as needed, e.g.: -->
                <!-- <p><strong>Engine:</strong> ${itemData.inv_engine || 'N/A'}</p> -->
                <!-- <p><strong>Transmission:</strong> ${itemData.inv_transmission || 'N/A'}</p> -->
            </div>
        </div>
    `;
    return html;
}

/* ****************************************************
* Build Classification Select List for Add Inventory Form
* **************************************************** */
Util.buildClassificationList = async function (classification_id = null) {
    let data = await invModel.getClassifications();
    let classificationList =
    '<select name="classification_id" id="classificationList" required>'; // I modified the id only so it's more specific for this
    classificationList += "<option value=''>Choose a Classification</option>";
    if (data && data.rows) { // I added this truthy check
        data.rows.forEach((row) => {
        classificationList += '<option value="' + row.classification_id + '"';
        if (
            classification_id != null &&
            row.classification_id == classification_id // Use loose equality for comparison if one might be string and other number
        ) {
            classificationList += " selected ";
        }
        classificationList += ">" + row.classification_name + "</option>";
        });
    }
    classificationList += "</select>";
    return classificationList;
};

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("Please log in")
     res.clearCookie("jwt")
     return res.redirect("/account/login")
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
   })
 } else {
  next()
 }
}

/* ****************************************
 *  Check Login
 * ************************************ */
 Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
 }

 /* ****************************************
 *  Check account type for authorization
 * ************************************ */
Util.checkAccountType = (req, res, next) => {
    const accountType = res.locals.accountData.account_type;
    if (accountType === "Employee" || accountType === "Admin") {
        next(); // Thus, user is authorized, hooray!
    } else {
        req.flash("notice", "You do not have permission to access this page.");
        return res.redirect("/account/login");
    }
};

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            async function (err, accountData) { // Make this function async
                if (err) {
                    req.flash("Please log in")
                    res.clearCookie("jwt")
                    return res.redirect("/account/login")
                }
                res.locals.accountData = accountData;
                res.locals.loggedin = 1;
                // ADDED: Get unread message count
                const unreadCount = await messageModel.getUnreadMessageCount(accountData.account_id);
                res.locals.unreadMessages = unreadCount;
                // END ADDITION
                next();
            })
    } else {
        next();
    }
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)


// NEW MESSAGE FEATURE ADDED FINAL PROJECT

/* **************************************
* Build the message list view HTML
* ************************************ */
Util.buildMessageGrid = async function (data, isArchive = false) {
    let grid = '<table id="message-table">';
    if (data.length > 0) {
        grid += '<thead><tr><th>Subject</th><th>From</th><th>Date</th><th>Read</th><th>Actions</th></tr></thead>';
        grid += '<tbody>';
        data.forEach(message => {
            const readStatus = message.message_read ? 'read-message' : 'unread-message';
            grid += `<tr class="${readStatus}">`;
            grid += `<td id=msg-subject-grid><a href="/messages/read/${message.message_id}">${message.message_subject}</a></td>`;
            grid += `<td>${message.account_firstname} ${message.account_lastname}</td>`;
            grid += `<td>${new Date(message.message_created).toLocaleString()}</td>`;
            grid += `<td>${message.message_read ? 'Yes' : 'No'}</td>`;
            grid += `<td class="message-actions">
                        <a href="/messages/delete/${message.message_id}" class="action-btn delete">Delete</a>`;
            if (!isArchive) {
                 grid += `<form action="/messages/archive/${message.message_id}" method="post">
                             <button type="submit" class="action-btn archive">Archive</button>
                          </form>`;
            }
            grid += `</td></tr>`;
        });
        grid += '</tbody>';
    } else {
        grid += '<tr><td colspan="5" class="notice">You have no messages in this view.</td></tr>';
    }
    grid += '</table>';
    return grid;
};

/* **************************************
* Build the single message detail view
* ************************************ */
Util.buildMessageDetailView = async function (message) {
    let detailView = `
        <div class="message-header">
            <p><strong>From:</strong> ${message.account_firstname} ${message.account_lastname}</p>
            <p><strong>Sent:</strong> ${new Date(message.message_created).toLocaleString()}</p>
            <p><strong>Subject:</strong> ${message.message_subject}</p>
        </div>
        <hr>
        <div class="message-body">
            <p>${message.message_body.replace(/\n/g, '<br>')}</p>
        </div>
        <hr>
        <div class="message-controls">
            <a href="/messages/reply/${message.message_id}" class="management-button">Reply</a>
            <a href="/messages/delete/${message.message_id}" class="form-button delete-button">Delete</a>
        </div>
    `;
    return detailView;
};

/* ****************************************************
* Build Recipient Select List for New Message Form
* **************************************************** */
Util.buildRecipientList = async function (recipients, selected_id = null) {
    let list = `<select name="message_to" id="message_to" required>`;
    list += "<option value=''>Choose a Recipient</option>";
    recipients.forEach((recipient) => {
        list += `<option value="${recipient.account_id}"`;
        if (selected_id != null && recipient.account_id == selected_id) {
            list += " selected";
        }
        list += `>${recipient.account_firstname} ${recipient.account_lastname}</option>`;
    });
    list += "</select>";
    return list;
};

module.exports = Util;