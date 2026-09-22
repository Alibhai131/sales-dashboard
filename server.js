const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/db');

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration (CRITICAL FIX)
app.use(session({
    secret: process.env.JWT_SECRET || 'sales_dashboard_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
}));

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// EJS View Engine & Layouts Setup
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Custom Middleware - Injects User & Currency Symbol into ALL views
app.use((req, res, next) => {
    const sessionUser = (req.session && req.session.user) ? req.session.user : null;
    res.locals.user = sessionUser;
    
    // Multi-Currency Symbol Map
    const currencyMap = {
        USD: '$',
        GBP: '£',
        PKR: 'Rs ',
        INR: '₹',
        EUR: '€',
        AED: 'د.إ '
    };
    
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

// Auth Routes (Login / Register) - NO auth middleware here
app.use('/auth', require('./routes/authRoutes'));

// Protected Dashboard Routes
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));

// Admin Routes
app.use('/admin', require('./routes/adminRoutes'));

// API Routes
app.use('/api', require('./routes/apiRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/products', require('./routes/productRoutes')); // for fetch calls
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

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
        body: `
            <div style="text-align: center; padding: 4rem 1rem;">
                <h1 style="font-size: 3rem; color: #ef4444;">404</h1>
                <h2>Page Not Found</h2>
                <p style="color: #64748b;">The page you are looking for does not exist.</p>
                <a href="/dashboard" class="btn btn-primary" style="margin-top: 1.5rem; display: inline-block;">Back to Dashboard</a>
            </div>
        `,
        showSidebar: false,
        showHeader: false
    });
});

// Error Handler (Shows exact error for debugging)
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send(`
        <div style="padding: 2rem; font-family: sans-serif;">
            <h2 style="color: #ef4444;">Server Error</h2>
            <p><strong>Message:</strong> ${err.message}</p>
            <pre style="background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto;">${err.stack}</pre>
        </div>
    `);
});

// Start Server locally (Skipped on Vercel serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
    });
}

module.exports = app;