const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error_msg', 'Please log in');
      return res.redirect('/login');
    }

    if (!roles.includes(req.session.user.role)) {
      req.flash('error_msg', 'You do not have permission to access this page');
      return res.redirect('/dashboard');
    }

    next();
  };
};

module.exports = { roleCheck };