const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path resolution for Vercel
const publicPath = path.join(__dirname, 'public');
const viewsPath = path.join(__dirname, 'views');

app.use(express.static(publicPath));
app.set('view engine', 'ejs');
app.set('views', viewsPath);

// Session (Standard memory store for now)
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/sales', require('./routes/saleRoutes'));
app.use('/employees', require('./routes/employeeRoutes'));
app.use('/analytics', require('./routes/analyticsRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/apiRoutes'));

// Connect to DB on every request (Vercel best practice)
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

module.exports = app;