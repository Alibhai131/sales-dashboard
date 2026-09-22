const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Invalid email or password',
                email
            });
        }

        // Check if account is blocked
        if (user.isBlocked) {
            return res.render('auth/login', {
                title: 'Login - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Your account has been blocked. Please contact support.',
                email
            });
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Invalid email or password',
                email
            });
        }

        // Check if buyer account is approved by Super Admin
        if (user.role === 'buyer' && !user.isApproved) {
            return res.render('auth/login', {
                title: 'Login - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Your account is pending approval by the Admin. Please wait for approval.',
                email
            });
        }

        // Create User Session Object
        const sessionUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName || '',
    currency: user.currency || 'USD',
    isApproved: user.isApproved,
    isBlocked: user.isBlocked
};

        // Save into Session
        req.session.user = sessionUser;

        // Also generate JWT token as fallback cookie
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '14d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000
        });

        // Redirect based on role
        if (user.role === 'superadmin' || user.role === 'subadmin') {
            return res.redirect('/admin/buyers');
        }
        
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login Error:', error);
        res.render('auth/login', {
            title: 'Login - Sales Dashboard',
            showSidebar: false,
            showHeader: false,
            error: 'An unexpected error occurred. Please try again.',
            email: req.body.email
        });
    }
};

// 2. REGISTER
exports.register = async (req, res) => {
    try {
        const { name, shopName, email, phone, currency, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Passwords do not match',
                name, shopName, email, phone
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register - Sales Dashboard',
                showSidebar: false,
                showHeader: false,
                error: 'Email is already registered. Please sign in.',
                name, shopName, email, phone
            });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create Buyer User (Default: pending approval)
        await User.create({
            name,
            shopName,
            email: email.toLowerCase(),
            phone,
            currency: currency || 'USD',
            password: hashedPassword,
            role: 'buyer',
            isApproved: false, // Super Admin approves them
            isBlocked: false,
            subscriptionActive: true,
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
        });

        res.render('auth/login', {
            title: 'Login - Sales Dashboard',
            showSidebar: false,
            showHeader: false,
            success: 'Registration successful! Your account is pending admin approval.'
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.render('auth/register', {
            title: 'Register - Sales Dashboard',
            showSidebar: false,
            showHeader: false,
            error: 'Registration failed. Please try again.'
        });
    }
};

// 3. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.render('auth/forgot-password', {
                title: 'Forgot Password',
                showSidebar: false,
                showHeader: false,
                error: 'No account with that email address exists.'
            });
        }

        // Generate temporary reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send response (In production, email this link using nodemailer)
        res.render('auth/forgot-password', {
            title: 'Forgot Password',
            showSidebar: false,
            showHeader: false,
            success: `Reset link generated! Use this URL to reset: /auth/reset-password/${resetToken}`
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.render('auth/forgot-password', {
            title: 'Forgot Password',
            showSidebar: false,
            showHeader: false,
            error: 'Error processing request.'
        });
    }
};

// 4. RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.render('auth/reset-password', {
                title: 'Reset Password',
                token,
                showSidebar: false,
                showHeader: false,
                error: 'Invalid or expired reset token.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.render('auth/login', {
            title: 'Login',
            showSidebar: false,
            showHeader: false,
            success: 'Password updated successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.render('auth/reset-password', {
            title: 'Reset Password',
            token: req.params.token,
            showSidebar: false,
            showHeader: false,
            error: 'Token has expired or is invalid.'
        });
    }
};

// 5. LOGOUT
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.clearCookie('token');
        res.redirect('/auth/login');
    });
};