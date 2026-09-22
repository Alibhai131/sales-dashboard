const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect DB for local development
if (!process.env.VERCEL) {
    connectDB();
}

// Session Setup
app.use(session({
    secret: process.env.JWT_SECRET || 'sales_dashboard_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// Static & View Engine Setup (Vercel Serverless Compatible)
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Custom Locals Middleware
app.use((req, res, next) => {
    const sessionUser = (req.session && req.session.user) ? req.session.user : null;
    res.locals.user = sessionUser;
    
    const currencyMap = { USD: '$', GBP: '£', PKR: 'Rs ', INR: '₹', EUR: '€', AED: 'د.إ ' };
    const userCurr = sessionUser?.currency || process.env.DEFAULT_CURRENCY || 'USD';
    res.locals.selectedCurrency = userCurr;
    res.locals.currencySymbol = currencyMap[userCurr] || '$';

    res.locals.success = req.session?.success || null;
    res.locals.error = req.session?.error || null;
    
    if (req.session) {
        delete req.session.success;
        delete req.session.error;
    }
    next();
});

// ============================================
// MOUNT ROUTES
// ============================================
app.use('/auth', require('./routes/authRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// API Routes
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root redirect
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/auth/login');
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('layouts/main', {
        title: '404 - Page Not Found',
        body: `<div style="text-align: center; padding: 4rem 1rem;"><h1>404</h1><h2>Page Not Found</h2><a href="/dashboard" class="btn btn-primary" style="margin-top:1rem;">Back to Dashboard</a></div>`,
        showSidebar: false,
        showHeader: false
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send('Server Error: ' + err.message);
});

// Start Server locally
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
    });
}

module.exports = app;