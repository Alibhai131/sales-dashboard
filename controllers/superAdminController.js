const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create Sub Admin
exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check sub admin count (max 2)
    const subAdminCount = await User.countDocuments({ role: 'subadmin' });
    if (subAdminCount >= 2) {
      req.flash('error_msg', 'Maximum 2 Sub Admins allowed');
      return res.redirect('/admin');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/admin');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const subAdmin = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'subadmin',
      isApproved: true,
      isActive: true,
      subscription: {
        plan: 'unlimited',
        status: 'active',
        expiresAt: new Date('2099-12-31')
      }
    });

    await subAdmin.save();
    req.flash('success_msg', `Sub Admin ${name} created successfully`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Create sub admin error:', error);
    req.flash('error_msg', 'Error creating sub admin');
    res.redirect('/admin');
  }
};

// Delete Sub Admin
exports.deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await User.findById(req.params.id);
    if (!subAdmin || subAdmin.role !== 'subadmin') {
      req.flash('error_msg', 'Sub Admin not found');
      return res.redirect('/admin');
    }

    await User.findByIdAndDelete(req.params.id);
    req.flash('success_msg', `Sub Admin ${subAdmin.name} deleted`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Delete sub admin error:', error);
    req.flash('error_msg', 'Error deleting sub admin');
    res.redirect('/admin');
  }
};

// Get Sub Admins list
exports.getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'subadmin' }).select('-password');
    res.json({ success: true, subAdmins });
  } catch (error) {
    res.json({ success: false, message: 'Error fetching sub admins' });
  }
};