// In backend/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Our security guard middleware
const db = require('../db');
const bcrypt = require('bcryptjs');

// Middleware to check if the user is an admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Admin access denied' });
    }
    next();
};

// @route   POST /api/users
// @desc    Admin creates a new user (employee or manager)
// @access  Private (Admin only)
router.post('/', [auth, adminAuth], async (req, res) => {
    const { name, email, password, role, manager_id } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please provide name, email, password, and role' });
    }

    try {
        const admin_company_id_result = await db.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
        const company_id = admin_company_id_result.rows[0].company_id;

        const userExists = await db.query('SELECT email FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            `INSERT INTO users (name, email, password_hash, role, company_id, manager_id) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, email, role, manager_id`,
            [name, email, password_hash, role, company_id, manager_id || null]
        );

        res.status(201).json(newUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users
// @desc    Admin gets a list of all users in their company
// @access  Private (Admin only)
router.get('/', [auth, adminAuth], async (req, res) => {
    try {
        const admin_company_id_result = await db.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
        const company_id = admin_company_id_result.rows[0].company_id;

        const users = await db.query('SELECT id, name, email, role, manager_id FROM users WHERE company_id = $1', [company_id]);
        res.json(users.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;