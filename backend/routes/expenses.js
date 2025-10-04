const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Importing the security guard
const db = require('../db');

// Route to get a summary of expenses for the dashboard
// Notice 'auth' is placed here. This protects the route.
router.get('/summary', auth, async (req, res) => {
    try {
        // req.user.id is available because our 'auth' middleware added it
        const userId = req.user.id; 

        const summaryQuery = `
            SELECT
                COUNT(*) AS expense_count,
                COALESCE(SUM(amount), 0) AS total_amount
            FROM expenses
            WHERE user_id = $1;
        `;

        const summaryResult = await db.query(summaryQuery, [userId]);
        res.json(summaryResult.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;