const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// @route   POST /api/companies/register
// @desc    Register a new company and its first admin user
router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword, country } = req.body;

    // --- Validation ---
    if (!name || !email || !password || !country) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'Passwords do not match' });
    }

    try {
        // Check if a user with this email already exists across all companies
        const userExists = await db.query('SELECT email FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        // --- Database Transaction ---
        // We use a transaction because we need to create a company AND a user.
        // If one fails, the whole operation should be cancelled (rolled back).
        await db.query('BEGIN');

        // 1. Create the new company
        const newCompany = await db.query(
            'INSERT INTO companies (name, country) VALUES ($1, $2) RETURNING id',
            [name, country]
        );
        const companyId = newCompany.rows[0].id;

        // 2. Hash the admin's password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Create the new admin user and link them to the new company
        const newAdmin = await db.query(
            'INSERT INTO users (name, email, password_hash, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [name, email, password_hash, 'admin', companyId]
        );

        // If everything was successful, commit the transaction
        await db.query('COMMIT');

        res.status(201).json({
            msg: 'Company and admin user created successfully!',
            user: newAdmin.rows[0]
        });

    } catch (err) {
        // If any error occurred, roll back the transaction
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;