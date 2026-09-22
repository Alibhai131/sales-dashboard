const User = require('../models/User');

const subscriptionCheck = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Super admin and sub admin bypass subscription check
  if (['superadmin', 'subadmin'].includes(req.session.user.role)) {
    return next();
  }

  try {
    const user = await User.findById(req.session.user._id);
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    // Check if subscription is blocked
    if (user.subscription.status === 'blocked') {
      return res.render('auth/blocked', {
        title: 'Access Blocked',
        message: 'Your subscription has been blocked. Please contact admin to resolve this issue.'
      });
    }

    // Check if subscription expired
    if (user.subscription.expiresAt && new Date() > user.subscription.expiresAt) {
      user.subscription.status = 'expired';
      await user.save();
      
      // Allow read-only access - set flag
      req.readOnly = true;
      res.locals.readOnly = true;
      res.locals.subscriptionExpired = true;
    }

    // Check if approved
    if (!user.isApproved) {
      return res.render('auth/pending', {
        title: 'Pending Approval',
        message: 'Your account is pending approval. Please wait for admin to approve your account.'
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};

module.exports = { subscriptionCheck };