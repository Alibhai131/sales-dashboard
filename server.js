const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();

const app = express();

// Trust Vercel Reverse Proxy
app.set('trust proxy', 1);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration
const sessionSecret = process.env.JWT_SECRET || 'sales_dashboard_secret_key_2024';
const mongoUri = process.env.MONGODB_URI;

const sessionConfig = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
};

if (mongoUri) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: mongoUri,
        ttl: 14 * 24 * 60 * 60,
        touchAfter: 24 * 3600
    });
}

app.use(session(sessionConfig));

// Static Files & View Engine Setup
const rootDir = process.cwd();
app.use(express.static(path.join(rootDir, 'public')));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

// Custom Middleware for User & Currency Locals
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

// Root Redirect
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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
});

// Start Server locally
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
    });
}

module.exports = app;