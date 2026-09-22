const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { getAllCurrencies } = require('../utils/currencyConverter');

// Show settings page
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    const currencies = getAllCurrencies();

    res.render('dashboard/settings', {
      title: 'Settings',
      userData: user,
      currencies,
      user: req.session.user,
      readOnly: res.locals.readOnly || false
    });
  } catch (error) {
    console.error('Settings error:', error);
    req.flash('error_msg', 'Error loading settings');
    res.redirect('/dashboard');
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, businessName, phone, currency } = req.body;

    const user = await User.findById(req.session.user._id);
    user.name = name || user.name;
    user.businessName = businessName || '';
    user.phone = phone || '';
    user.currency = currency || 'USD';
    await user.save();

    // Update session
    req.session.user.name = user.name;
    req.session.user.businessName = user.businessName;
    req.session.user.currency = user.currency;

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/settings');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/settings');
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/settings');
    }

    if (newPassword.length < 6) {
      req.flash('error_msg', 'Password must be at least 6 characters');
      return res.redirect('/settings');
    }

    const user = await User.findById(req.session.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/settings');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/settings');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error_msg', 'Error changing password');
    res.redirect('/settings');
  }
};

// Update e-commerce settings
exports.updateEcommerce = async (req, res) => {
  try {
    const { ecommercePlatform, ecommerceApiKey, ecommerceStoreUrl } = req.body;

    await User.findByIdAndUpdate(req.session.user._id, {
      ecommercePlatform: ecommercePlatform || 'none',
      ecommerceApiKey: ecommerceApiKey || '',
      ecommerceStoreUrl: ecommerceStoreUrl || ''
    });

    req.flash('success_msg', 'E-commerce settings updated');
    res.redirect('/settings');
  } catch (error) {
    console.error('Update ecommerce error:', error);
    req.flash('error_msg', 'Error updating e-commerce settings');
    res.redirect('/settings');
  }
};