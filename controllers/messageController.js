const messageModel = require("../models/message-model");
const utilities = require("../utilities");

const messageCont = {};

/* ***************************
 *  Create Inbox View
 * ************************** */
messageCont.buildInbox = async function (req, res, next) {
    let nav = await utilities.getNav();
    const account_id = res.locals.accountData.account_id;
    const messages = await messageModel.getMessagesByAccountId(account_id);
    const messageGrid = await utilities.buildMessageGrid(messages);
    const unreadCount = await messageModel.getUnreadMessageCount(account_id);

    res.render("message/inbox", {
        title: "My Inbox",
        nav,
        errors: null,
        messageGrid,
        unreadCount
    });
};

/* ***************************
 *  Create Archived Messages View
 * ************************** */
messageCont.buildArchive = async function (req, res, next) {
    let nav = await utilities.getNav();
    const account_id = res.locals.accountData.account_id;
    const messages = await messageModel.getArchivedMessagesByAccountId(account_id);
    const messageGrid = await utilities.buildMessageGrid(messages, true); // Pass true for archive view

    res.render("message/archive", {
        title: "Archived Messages",
        nav,
        errors: null,
        messageGrid
    });
};

/* ***************************
 *  Create New Message View
 * ************************** */
messageCont.buildCreateMessageView = async function (req, res, next) {
    let nav = await utilities.getNav();
    const recipients = await messageModel.getAllAccounts();
    const recipientList = await utilities.buildRecipientList(recipients);

    res.render("message/create", {
        title: "New Message",
        nav,
        errors: null,
        recipientList,
        message_to: null,
        message_subject: "",
        message_body: ""
    });
};

/* ***************************
 *  Process New Message Creation
 * ************************** */
messageCont.processNewMessage = async function (req, res, next) {
    const { message_to, message_subject, message_body } = req.body;
    const message_from = res.locals.accountData.account_id;

    const result = await messageModel.createMessage(message_to, message_from, message_subject, message_body);

    if (result) {
        req.flash("notice", "Message sent successfully!");
        res.redirect("/messages");
    } else {
        let nav = await utilities.getNav();
        const recipients = await messageModel.getAllAccounts();
        const recipientList = await utilities.buildRecipientList(recipients, message_to);
        req.flash("notice", "Sorry, the message could not be sent.");
        res.status(501).render("message/create", {
            title: "New Message",
            nav,
            errors: null,
            recipientList,
            message_subject,
            message_body
        });
    }
};

/* ***************************
 *  Build Read Message View
 * ************************** */
messageCont.buildReadMessageView = async function (req, res, next) {
    const message_id = parseInt(req.params.messageId);
    const account_id = res.locals.accountData.account_id;
    const messageData = await messageModel.getMessageById(message_id);

    // Ensure the logged-in user is the recipient
    if (!messageData || messageData.message_to !== account_id) {
        req.flash("notice", "You are not authorized to view this message.");
        return res.redirect("/messages");
    }

    let nav = await utilities.getNav();
    // Mark as read if it's currently unread
    if (!messageData.message_read) {
        await messageModel.markMessageAsRead(message_id, account_id);
    }
    const messageContent = await utilities.buildMessageDetailView(messageData);

    res.render("message/read", {
        title: messageData.message_subject,
        nav,
        errors: null,
        messageContent
    });
};

/* ***************************
 *  Build Reply Message View
 * ************************** */
messageCont.buildReplyView = async function (req, res, next) {
    const message_id = parseInt(req.params.messageId);
    const account_id = res.locals.accountData.account_id;
    const originalMessage = await messageModel.getMessageById(message_id);

    if (!originalMessage || originalMessage.message_to !== account_id) {
        req.flash("notice", "You cannot reply to this message.");
        return res.redirect("/messages");
    }

    let nav = await utilities.getNav();
    const recipients = await messageModel.getAllAccounts();
    const recipientList = await utilities.buildRecipientList(recipients, originalMessage.message_from);

    const subject = originalMessage.message_subject.startsWith("RE:")
        ? originalMessage.message_subject
        : `RE: ${originalMessage.message_subject}`;

    // This is for stylized Default header on the message view
    const body = `
        \n\n----- Original Message -----\n
        From: ${originalMessage.account_firstname} ${originalMessage.account_lastname}\n
        Sent: ${new Date(originalMessage.message_created).toLocaleString()}\n
        Subject: ${originalMessage.message_subject}\n
        ${originalMessage.message_body}`;

    res.render("message/create", {
        title: "Reply to Message",
        nav,
        errors: null,
        recipientList,
        message_subject: subject,
        message_body: body
    });
};

/* ***************************
 *  Build Delete Confirmation View
 * ************************** */
messageCont.buildDeleteConfirmationView = async function (req, res, next) {
    const message_id = parseInt(req.params.messageId);
    const account_id = res.locals.accountData.account_id;
    const message = await messageModel.getMessageById(message_id);

    // Security check: only the recipient can see the delete confirmation page
    if (!message || message.message_to !== account_id) {
        req.flash("notice", "You are not authorized to delete this message.");
        return res.redirect("/messages");
    }

    let nav = await utilities.getNav();
    res.render("message/delete-confirm", {
        title: "Confirm Deletion",
        nav,
        errors: null,
        message: message
    });
};

/* ***************************
 *  Process Message Deletion
 * ************************** */
messageCont.processDelete = async function (req, res, next) {
    const message_id = parseInt(req.body.message_id);
    const account_id = res.locals.accountData.account_id;

    // The security check is implicitly handled by the model query which requires account_id
    const result = await messageModel.deleteMessage(message_id, account_id);
    if (result) {
        req.flash("notice", "Message deleted successfully.");
    } else {
        req.flash("notice", "Failed to delete message. It may have already been removed.");
    }
    res.redirect("/messages");
};


/* ***************************
 *  Process Message Archive
 * ************************** */
messageCont.processArchive = async function (req, res, next) {
    const message_id = parseInt(req.params.messageId);
    const account_id = res.locals.accountData.account_id;
    const result = await messageModel.archiveMessage(message_id, account_id);
    if (result) {
        req.flash("notice", "Message archived.");
    } else {
        req.flash("notice", "Failed to archive message.");
    }
    res.redirect("/messages");
};

module.exports = messageCont;