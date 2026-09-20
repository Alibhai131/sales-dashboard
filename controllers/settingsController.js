const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Render Settings Page
exports.getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        res.render('dashboard/settings', { user: req.session.user, fullUser: user, error: null, success: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Settings Error');
    }
};

// Update Profile & Currency
exports.updateProfile = async (req, res) => {
    const { name, currency } = req.body;
    try {
        const user = await User.findById(req.session.user.id);
        user.name = name || user.name;
        user.currency = currency || user.currency;
        await user.save();

        // Update session
        req.session.user.name = user.name;
        req.session.user.currency = user.currency;

        res.render('dashboard/settings', { user: req.session.user, fullUser: user, error: null, success: 'Profile & Currency updated successfully!' });
    } catch (err) {
        console.error(err);
        res.render('dashboard/settings', { user: req.session.user, fullUser: req.session.user, error: 'Failed to update settings', success: null });
    }
};

// Update Password
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    try {
        const user = await User.findById(req.session.user.id);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.render('dashboard/settings', { user: req.session.user, fullUser: user, error: 'Current password is incorrect.', success: null });
        }

        if (newPassword !== confirmPassword) {
            return res.render('dashboard/settings', { user: req.session.user, fullUser: user, error: 'New passwords do not match.', success: null });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.render('dashboard/settings', { user: req.session.user, fullUser: user, error: null, success: 'Password changed successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Password Update Error');
    }
};