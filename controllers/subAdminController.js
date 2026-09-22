const User = require('../models/User');
const Notification = require('../models/Notification');

// Sub Admin can view all buyers
exports.viewAllBuyers = async (req, res) => {
  try {
    const buyers = await User.find({ role: 'buyer' })
      .sort({ createdAt: -1 })
      .select('-password');

    res.render('admin/buyers', {
      title: 'Manage Buyers',
      buyers,
      user: req.session.user
    });
  } catch (error) {
    console.error('Sub admin view buyers error:', error);
    req.flash('error_msg', 'Error loading buyers');
    res.redirect('/dashboard');
  }
};

// Sub Admin can add new buyer
exports.addBuyer = async (req, res) => {
  try {
    const { name, email, password, businessName, phone } = req.body;
    const bcrypt = require('bcryptjs');

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/admin');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newBuyer = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'buyer',
      isApproved: true,
      isActive: true,
      businessName: businessName || '',
      phone: phone || '',
      subscription: {
        plan: 'monthly',
        status: 'active',
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await newBuyer.save();
    req.flash('success_msg', `Buyer ${name} added successfully`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Add buyer error:', error);
    req.flash('error_msg', 'Error adding buyer');
    res.redirect('/admin');
  }
};