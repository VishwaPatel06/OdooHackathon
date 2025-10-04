// In backend/routes/approvalRules.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Middleware to check if the user is an admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Admin access denied' });
    }
    next();
};

// @route   POST /api/approval-rules
// @desc    Admin creates a new approval rule
// @access  Private (Admin only)
router.post('/', [auth, adminAuth], async (req, res) => {
    // The request body will contain the rule's name and an array of steps
    const { name, is_sequential, is_manager_first_approver, steps } = req.body;

    // Basic validation
    if (!name || !steps || steps.length === 0) {
        return res.status(400).json({ msg: 'Please provide a rule name and at least one approval step.' });
    }

    try {
        // Get the admin's company ID to associate the rule with the company
        const adminResult = await db.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
        const company_id = adminResult.rows[0].company_id;

        // Start a database transaction
        await db.query('BEGIN');

        // 1. Insert the main approval rule
        const ruleResult = await db.query(
            'INSERT INTO approval_rules (company_id, name, is_sequential, is_manager_first_approver) VALUES ($1, $2, $3, $4) RETURNING id',
            [company_id, name, is_sequential, is_manager_first_approver]
        );
        const rule_id = ruleResult.rows[0].id;

        // 2. Insert each step from the "steps" array into the database
        for (const step of steps) {
            await db.query(
                'INSERT INTO approval_rule_steps (rule_id, approver_user_id, step_number, is_required) VALUES ($1, $2, $3, $4)',
                [rule_id, step.approver_user_id, step.step_number, step.is_required || true]
            );
        }

        // If all insertions were successful, commit the transaction
        await db.query('COMMIT');

        res.status(201).json({ msg: 'Approval rule created successfully', rule_id: rule_id });

    } catch (err) {
        // If any error occurred, roll back the transaction
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/approval-rules
// @desc    Admin gets all approval rules for their company
// @access  Private (Admin only)
router.get('/', [auth, adminAuth], async (req, res) => {
    try {
        const adminResult = await db.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
        const company_id = adminResult.rows[0].company_id;

        const rules = await db.query('SELECT * FROM approval_rules WHERE company_id = $1', [company_id]);
        res.json(rules.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;