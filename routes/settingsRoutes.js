const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.use(isAuthenticated);

// RENDER SETTINGS PAGE
router.get('/', (req, res) => {
    res.render('dashboard/settings', {
        title: 'Settings - Sales Dashboard',
        activePage: 'settings',
        pageTitle: 'Settings',
        subscription: {
            isActive: true,
            plan: 'Lifetime',
            expiresAt: null
        }
    });
});

// UPDATE PROFILE (Name, Email, Phone)
router.post('/profile', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const userId = req.session.user._id;

        console.log('Profile update for user:', userId);

        if (!name || !email) {
            req.session.error = 'Name and Email are required';
            return res.redirect('/settings');
        }

        // Check if another user already has this email
        const existing = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: userId }
        });

        if (existing) {
            req.session.error = 'That email is already used by another account';
            return res.redirect('/settings');
        }

        // Update in MongoDB
        await User.findByIdAndUpdate(userId, {
            $set: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone ? phone.trim() : ''
            }
        });

        // Update the live session so header changes immediately
        req.session.user.name = name.trim();
        req.session.user.email = email.toLowerCase().trim();

        req.session.success = 'Profile updated successfully!';
        res.redirect('/settings');

    } catch (err) {
        console.error('Profile update error:', err);
        req.session.error = 'Failed to update profile: ' + err.message;
        res.redirect('/settings');
    }
});

// UPDATE PASSWORD
router.post('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user._id;

        if (newPassword !== confirmPassword) {
            req.session.error = 'New passwords do not match';
            return res.redirect('/settings');
        }

        const user = await User.findById(userId);
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/settings');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.session.error = 'Current password is incorrect';
            return res.redirect('/settings');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        req.session.success = 'Password changed successfully!';
        res.redirect('/settings');

    } catch (err) {
        console.error('Password change error:', err);
        req.session.error = 'Error changing password';
        res.redirect('/settings');
    }
});

// UPDATE CURRENCY (JSON for AJAX)
router.put('/currency', async (req, res) => {
    try {
        const { currency } = req.body;
        const valid = ['USD', 'GBP', 'PKR', 'INR', 'EUR', 'AED'];
        if (!valid.includes(currency)) {
            return res.status(400).json({ success: false, message: 'Invalid currency' });
        }

        await User.findByIdAndUpdate(req.session.user._id, { $set: { currency } });
        req.session.user.currency = currency;

        res.json({ success: true, currency });
    } catch (err) {
        console.error('Currency update error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// BUSINESS SETTINGS
router.post('/business', async (req, res) => {
    try {
        const { shopName, address, businessType } = req.body;
        const userId = req.session.user._id;

        await User.findByIdAndUpdate(userId, {
            $set: {
                shopName: shopName || '',
                address: address || '',
                businessType: businessType || 'retail'
            }
        });

        req.session.user.shopName = shopName || '';
        req.session.success = 'Business settings saved!';
        res.redirect('/settings');

    } catch (err) {
        console.error('Business settings error:', err);
        req.session.error = 'Failed to save business settings';
        res.redirect('/settings');
    }
});

module.exports = router;