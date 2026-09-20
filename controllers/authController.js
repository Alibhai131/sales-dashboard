const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Render Login Page
exports.getLogin = (req, res) => {
    res.render('auth/login', { error: null });
};

// Handle Login POST
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', { error: 'Invalid Email or Password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Invalid Email or Password' });
        }

        if (user.status === 'pending') {
            return res.render('auth/login', { error: 'Your account is pending admin approval.' });
        }

        // Save session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            currency: user.currency,
            status: user.status
        };

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Server error. Please try again.' });
    }
};

// Render Register Page
exports.getRegister = (req, res) => {
    res.render('auth/register', { error: null });
};

// Handle Register POST
exports.postRegister = async (req, res) => {
    const { name, email, password, currency } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.render('auth/register', { error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        user = new User({
            name,
            email,
            password: hashedPassword,
            currency: currency || 'USD',
            role: 'buyer',
            status: 'pending' // Admin must approve
        });

        await user.save();
        res.render('auth/login', { error: 'Registration successful! Please wait for Admin approval.' });
    } catch (err) {
        console.error(err);
        res.render('auth/register', { error: 'Server Error during registration.' });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};
// Render Forgot Password
exports.getForgotPassword = (req, res) => {
    res.render('auth/forgot-password', { error: null, success: null });
};

// Handle Forgot Password Request
exports.postForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/forgot-password', { error: 'No account with that email exists.', success: null });
        }

        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 Hour expire
        await user.save();

        const resetUrl = `http://${req.headers.host}/auth/reset-password/${resetToken}`;
        console.log(`🔐 Password Reset Link for ${email}: ${resetUrl}`);

        res.render('auth/forgot-password', { 
            error: null, 
            success: `Reset link generated! Check console or click link below: <br><a href="/auth/reset-password/${resetToken}" style="color:var(--color-primary);">Click Here to Reset Password</a>` 
        });
    } catch (err) {
        console.error(err);
        res.render('auth/forgot-password', { error: 'Server Error', success: null });
    }
};

// Render Reset Password Form
exports.getResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('auth/login', { error: 'Password reset token is invalid or has expired.' });
        }

        res.render('auth/reset-password', { token: req.params.token, error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login');
    }
};

// Handle Reset Password Submit
exports.postResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('auth/login', { error: 'Password reset token is invalid or has expired.' });
        }

        const { password } = req.body;
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.render('auth/login', { error: null, success: 'Password reset successful! Please login with your new password.' });
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login');
    }
};