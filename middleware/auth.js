const User = require('../models/User');

// Verify user is logged in
const ensureAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
};

// Verify user role
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).render('error', { message: 'Access Denied: Insufficient Permissions' });
        }
        next();
    };
};

// Check if buyer is blocked / unpaid (Allow Read-Only mode)
const checkSubscriptionStatus = async (req, res, next) => {
    try {
        if (!req.session.user) return res.redirect('/auth/login');

        // Super Admin and Sub Admin bypass subscription checks
        if (['superadmin', 'subadmin'].includes(req.session.user.role)) {
            return next();
        }

        const user = await User.findById(req.session.user.id);
        
        if (!user) return res.redirect('/auth/login');

        if (user.status === 'blocked' || user.subscriptionStatus === 'blocked') {
            // Block write operations (POST, PUT, DELETE) for blocked users
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                return res.status(403).json({ 
                    error: 'Subscription Blocked', 
                    message: 'Your account is currently blocked due to unpaid subscription. Access is read-only.' 
                });
            }
            req.session.user.isReadOnly = true; // Mark as read-only mode
        } else {
            req.session.user.isReadOnly = false;
        }

        next();
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login');
    }
};

module.exports = { ensureAuthenticated, checkRole, checkSubscriptionStatus };