const express = require("express");
const router = new express.Router();
const messageController = require("../controllers/messageController");
const utilities = require("../utilities/");
const msgValidate = require('../utilities/message-validation');

// All message routes require login
router.use(utilities.checkLogin);

// GET /messages/ - Default to inbox
router.get("/", utilities.handleErrors(messageController.buildInbox));

// GET /messages/archived - View archived messages
router.get("/archive", utilities.handleErrors(messageController.buildArchive));

// GET /messages/new - Display new message form
router.get("/new", utilities.handleErrors(messageController.buildCreateMessageView));

// POST /messages/new - Send a new message
router.post(
    "/new",
    msgValidate.newMessageRules(),
    msgValidate.checkMessageData,
    utilities.handleErrors(messageController.processNewMessage)
);

// GET /messages/read/:messageId - View a specific message
router.get("/read/:messageId", utilities.handleErrors(messageController.buildReadMessageView));

// GET /messages/reply/:messageId - Reply to a specific message
router.get("/reply/:messageId", utilities.handleErrors(messageController.buildReplyView));

// POST /messages/archive/:messageId - Archive a specific message
router.post("/archive/:messageId", utilities.handleErrors(messageController.processArchive));

// GET /messages/delete/:messageId - Display the delete confirmation view
router.get("/delete/:messageId", utilities.handleErrors(messageController.buildDeleteConfirmationView));

// POST /messages/delete - Process the actual deletion from the confirmation form
router.post("/delete", utilities.handleErrors(messageController.processDelete));

module.exports = router;