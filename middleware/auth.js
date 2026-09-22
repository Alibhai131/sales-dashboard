const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Check if user is logged in
const isAuthenticated = async (req, res, next) => {
    try {
       if (req.session && req.session.user) {
            req.user = req.session.user;   // <-- This line is critical
            res.locals.user = req.session.user;
            return next();
        }

        const token = req.cookies?.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
                res.locals.user = user;
                return next();
            }
        }

        return res.redirect('/auth/login');
    } catch (error) {
        return res.redirect('/auth/login');
    }
};

// 2. Check if Super Admin or Sub Admin
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).send('Access Denied');
        }
        next();
    };
};

// 3. STEP 4 FIX: Check if Buyer is Blocked or Subscription Expired
const checkSubscription = async (req, res, next) => {
    try {
        if (!req.user) return next();

        // Admins are never blocked or restricted
        if (req.user.role === 'superadmin' || req.user.role === 'subadmin') {
            res.locals.isReadOnly = false;
            return next();
        }

        // Fetch fresh user data from database
        const freshUser = await User.findById(req.user._id);

        if (!freshUser || freshUser.isBlocked) {
            if (req.session) req.session.destroy();
            res.clearCookie('token');
            return res.redirect('/auth/login?error=Your account has been blocked. Please contact support.');
        }

        if (!freshUser.isApproved) {
            return res.send(`
                <div style="text-align:center; padding: 4rem; font-family: sans-serif;">
                    <h2>Account Pending Approval</h2>
                    <p>Your account is waiting for admin approval.</p>
                    <a href="/auth/login">Back to Login</a>
                </div>
            `);
        }

        // Check if subscription has expired
        const isExpired = freshUser.subscriptionExpiry && new Date(freshUser.subscriptionExpiry) < new Date();
        const isUnpaid = !freshUser.subscriptionActive;

        if (isExpired || isUnpaid) {
            // Set Read-Only Mode (Can see data, but cannot add/delete)
            res.locals.isReadOnly = true;
            res.locals.subscriptionExpired = true;
        } else {
            res.locals.isReadOnly = false;
            res.locals.subscriptionExpired = false;
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { isAuthenticated, authorize, checkSubscription };