const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

dotenv.config();
const app = express();

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel Serverless EJS Views & Static Files Configuration
const viewsPath = path.join(process.cwd(), 'views');
const publicPath = path.join(process.cwd(), 'public');

app.set('views', viewsPath);
app.set('view engine', 'ejs');
app.use(express.static(publicPath));

// Express Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'sales_dashboard_session_secret_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware to ensure DB connection per request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

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

// Home Route
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

// Local listener
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Running locally on http://localhost:${PORT}`));
}

module.exports = app;