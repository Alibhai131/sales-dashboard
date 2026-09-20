const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

dotenv.config();
const app = express();

// Connect Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
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

app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sales Dashboard live at http://localhost:${PORT}`));