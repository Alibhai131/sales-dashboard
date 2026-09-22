const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Render Login Page
router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', {
        title: 'Login - Sales Dashboard',
        showSidebar: false,
        showHeader: false,
        error: req.query.error || null,
        success: req.query.success || null
    });
});

// 2. Process Login Form Submission
router.post('/login', authController.login);

// 3. Render Registration Page
router.get('/register', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', {
        title: 'Register - Sales Dashboard',
        showSidebar: false,
        showHeader: false,
        error: null
    });
});

// 4. Process Registration Form Submission
router.post('/register', authController.register);

// 5. Render Forgot Password Page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password - Sales Dashboard',
        showSidebar: false,
        showHeader: false,
        error: null,
        success: null
    });
});

// 6. Process Forgot Password Form Submission
router.post('/forgot-password', authController.forgotPassword);

// 7. Render Reset Password Page
router.get('/reset-password/:token', (req, res) => {
    res.render('auth/reset-password', {
        title: 'Reset Password - Sales Dashboard',
        token: req.params.token,
        showSidebar: false,
        showHeader: false,
        error: null
    });
});

// 8. Process Reset Password Form Submission
router.post('/reset-password/:token', authController.resetPassword);

// 9. Logout Route
router.get('/logout', authController.logout);

module.exports = router;