const { body, validationResult } = require("express-validator");
const utilities = require(".");
const messageModel = require("../models/message-model");
const validate = {};

/*  **********************************
 *  New Message Data Validation Rules
 *  Very simple rules that just require who to send to,
 *  message subject (header), and a non-empty string msg
 * ********************************* */
validate.newMessageRules = () => {
    return [
        body("message_to")
            .trim()
            .notEmpty()
            .withMessage("Please select a recipient."),

        body("message_subject")
            .trim()
            .notEmpty()
            .withMessage("Please provide a subject."),

        body("message_body")
            .trim()
            .notEmpty()
            .withMessage("Please provide a message body."),
    ];
};

/* ******************************
 * Check data and return errors or continue
 * ***************************** */
validate.checkMessageData = async (req, res, next) => {
    const { message_to, message_subject, message_body } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        const recipients = await messageModel.getAllAccounts();
        const recipientList = await utilities.buildRecipientList(recipients, message_to);

        res.status(400).render("message/create", {
            title: "New Message",
            nav,
            recipientList,
            errors,
            message_subject,
            message_body,
        });
        return;
    }
    next();
};

module.exports = validate;