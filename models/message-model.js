const pool = require("../database/");

/* *****************************
 *   Get all messages for a user ( Basically an Inbox)
 * *************************** */
async function getMessagesByAccountId(account_id) {
    try {
        const data = await pool.query(
            `SELECT m.message_id, m.message_subject, m.message_created, m.message_read, a.account_firstname, a.account_lastname
             FROM public.message AS m
             JOIN public.account AS a ON m.message_from = a.account_id
             WHERE m.message_to = $1 AND m.message_archived = false
             ORDER BY m.message_created DESC`,
            [account_id]
        );
        return data.rows;
    } catch (error) {
        console.error("getMessagesByAccountId error " + error);
        return [];
    }
}

/* *****************************
 *   Get all archived messages for a user (archived is requied as per the final project description)
 * *************************** */
async function getArchivedMessagesByAccountId(account_id) {
    try {
        const data = await pool.query(
            `SELECT m.message_id, m.message_subject, m.message_created, m.message_read, a.account_firstname, a.account_lastname
             FROM public.message AS m
             JOIN public.account AS a ON m.message_from = a.account_id
             WHERE m.message_to = $1 AND m.message_archived = true
             ORDER BY m.message_created DESC`,
            [account_id]
        );
        return data.rows;
    } catch (error) {
        console.error("getArchivedMessagesByAccountId error " + error);
        return [];
    }
}

/* *****************************
 *   Get a single message by ID
 * *************************** */
async function getMessageById(message_id) {
    try {
        const data = await pool.query(
            `SELECT m.*, a.account_firstname, a.account_lastname
             FROM public.message AS m
             JOIN public.account AS a ON m.message_from = a.account_id
             WHERE m.message_id = $1`,
            [message_id]
        );
        return data.rows[0];
    } catch (error) {
        console.error("getMessageById error " + error);
        return null;
    }
}

/* *****************************
 *   Create a new message
 * *************************** */
async function createMessage(message_to, message_from, message_subject, message_body) {
    try {
        const sql = `INSERT INTO public.message (message_to, message_from, message_subject, message_body)
                     VALUES ($1, $2, $3, $4) RETURNING *`;
        const result = await pool.query(sql, [message_to, message_from, message_subject, message_body]);
        return result.rows[0];
    } catch (error) {
        console.error("createMessage error: " + error);
        return null;
    }
}

/* *****************************
 *   Mark a message as read
 * *************************** */
async function markMessageAsRead(message_id, account_id) {
    try {
        const sql = "UPDATE public.message SET message_read = true WHERE message_id = $1 AND message_to = $2";
        await pool.query(sql, [message_id, account_id]);
        return true;
    } catch (error) {
        console.error("markMessageAsRead error: " + error);
        return false;
    }
}

/* *****************************
 *   Archive a message
 * *************************** */
async function archiveMessage(message_id, account_id) {
    try {
        const sql = "UPDATE public.message SET message_archived = true WHERE message_id = $1 AND message_to = $2";
        await pool.query(sql, [message_id, account_id]);
        return true;
    } catch (error) {
        console.error("archiveMessage error: " + error);
        return false;
    }
}

/* *****************************
 *   Delete a message
 * *************************** */
async function deleteMessage(message_id, account_id) {
    try {
        const sql = "DELETE FROM public.message WHERE message_id = $1 AND message_to = $2";
        const result = await pool.query(sql, [message_id, account_id]);
        return result.rowCount > 0;
    } catch (error) {
        console.error("deleteMessage error: " + error);
        return false;
    }
}

/* *****************************
 *   Get unread message count for a user
 * *************************** */
async function getUnreadMessageCount(account_id) {
    try {
        const result = await pool.query(
            "SELECT COUNT(*) FROM public.message WHERE message_to = $1 AND message_read = false AND message_archived = false",
            [account_id]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error("getUnreadMessageCount error: " + error);
        return 0;
    }
}

/* *****************************
 *   Get all accounts for messaging 'To' field
 * *************************** */
async function getAllAccounts() {
    try {
        const data = await pool.query("SELECT account_id, account_firstname, account_lastname FROM public.account ORDER BY account_lastname, account_firstname");
        return data.rows;
    } catch (error) {
        console.error("getAllAccounts error " + error);
        return [];
    }
}

module.exports = {
    getMessagesByAccountId,
    getArchivedMessagesByAccountId,
    getMessageById,
    createMessage,
    markMessageAsRead,
    archiveMessage,
    deleteMessage,
    getUnreadMessageCount,
    getAllAccounts
};