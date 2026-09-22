const express = require('express');
const router = express.Router();
const { isAuthenticated, checkSubscription } = require('../middleware/auth');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Employee = require('../models/Employee');

router.use(isAuthenticated);
router.use(checkSubscription);

function getCurrencySymbol(curr) {
    const symbols = { USD: '$', GBP: '£', PKR: 'Rs ', INR: '₹', EUR: '€', AED: 'د.إ ' };
    return symbols[curr] || '$';
}

// Build date range from period
function getDateRange(period) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    // End of today
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        // Start of this week (Monday)
        const day = now.getDay(); // 0 Sun ... 6 Sat
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
        // default today
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
}

// MAIN DASHBOARD
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const currencySymbol = getCurrencySymbol(req.user.currency);
        const period = req.query.period || 'today';
        const { start, end } = getDateRange(period);

        // Products & employees (always full list for dropdowns)
        const products = await Product.find({ owner: userId }).sort({ name: 1 });
        const employees = await Employee.find({ owner: userId }).sort({ name: 1 });

        // Sales filtered by selected period
        const periodQuery = {
            owner: userId,
            createdAt: { $gte: start, $lte: end }
        };

        const recentSales = await Sale.find(periodQuery).sort({ createdAt: -1 }).limit(10);
        const allPeriodSales = await Sale.find(periodQuery);
        const lastSold = await Sale.findOne({ owner: userId }).sort({ createdAt: -1 });

        // Calculate stats ONLY for selected period
        let totalSales = 0;
        let totalInvestment = 0;
        let totalProfit = 0;
        let onlineOrders = 0;
        let localSales = 0;

        allPeriodSales.forEach(s => {
            totalSales += s.sellingPrice || 0;
            totalInvestment += s.costPrice || 0;
            totalProfit += s.profit || 0;
            if (s.saleType === 'online') onlineOrders++;
            else localSales++;
        });

        const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0;
        const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

        const stats = {
            totalSales,
            totalProfit,
            totalInvestment,
            roi,
            profitMargin,
            salesPercent: 100,
            profitPercent: 100,
            investmentPercent: 100,
            onlineOrders,
            localSales,
            onlineChangePercent: 0,
            localChangePercent: 0
        };

        const recentUpdates = recentSales.map(s => ({
            customerName: s.employeeName !== 'Self' ? s.employeeName : req.user.name,
            action: `sold ${s.quantity}x ${s.productName}`,
            timeAgo: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        const periodLabel = {
            today: 'Today',
            week: 'This Week',
            month: 'This Month',
            year: 'This Year'
        }[period] || 'Today';

        res.render('dashboard/index', {
            title: 'Dashboard - Sales Dashboard',
            activePage: 'dashboard',
            pageTitle: 'Dashboard',
            stats,
            recentSales,
            recentUpdates,
            products,
            employees,
            lastSold: lastSold ? {
                productName: lastSold.productName,
                sellingPrice: lastSold.sellingPrice,
                costPrice: lastSold.costPrice,
                profit: lastSold.profit,
                timeAgo: new Date(lastSold.createdAt).toLocaleString()
            } : null,
            currencySymbol,
            currentPeriod: period,
            periodLabel
        });

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Error loading dashboard: ' + err.message);
    }
});

// ANALYTICS
router.get('/analytics', async (req, res) => {
    try {
        const userId = req.user._id;
        const currencySymbol = getCurrencySymbol(req.user.currency);
        const period = req.query.period || 'month';
        const { start, end } = getDateRange(period);

        const allSales = await Sale.find({
            owner: userId,
            createdAt: { $gte: start, $lte: end }
        });

        let totalRevenue = 0, netProfit = 0, onlineRevenue = 0, localRevenue = 0;

        allSales.forEach(s => {
            totalRevenue += s.sellingPrice || 0;
            netProfit += s.profit || 0;
            if (s.saleType === 'online') onlineRevenue += s.sellingPrice || 0;
            else localRevenue += s.sellingPrice || 0;
        });

        const avgProfitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        res.render('dashboard/analytics', {
            title: 'Analytics - Sales Dashboard',
            activePage: 'analytics',
            pageTitle: 'Analytics',
            analytics: {
                totalRevenue,
                netProfit,
                totalOrders: allSales.length,
                avgProfitMargin,
                onlineRevenue,
                localRevenue
            },
            chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            salesData: [0, 0, 0, 0, 0, 0, totalRevenue],
            profitData: [0, 0, 0, 0, 0, 0, netProfit],
            dailySalesData: [0, 0, 0, 0, 0, 0, totalRevenue],
            topProducts: [],
            employeePerformance: [],
            currencySymbol,
            currentPeriod: period
        });
    } catch (err) {
        res.status(500).send('Error loading analytics');
    }
});

// EMPLOYEES
router.get('/employees', async (req, res) => {
    try {
        const employees = await Employee.find({ owner: req.user._id }).sort({ createdAt: -1 });
        const currencySymbol = getCurrencySymbol(req.user.currency);

        res.render('dashboard/employees', {
            title: 'Employees - Sales Dashboard',
            activePage: 'employees',
            pageTitle: 'Employees',
            employees,
            currencySymbol
        });
    } catch (err) {
        res.status(500).send('Error loading employees');
    }
});

router.get('/notifications', (req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;