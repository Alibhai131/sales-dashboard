const express = require('express');
const router = express.Router();
const { isAuthenticated, checkSubscription } = require('../middleware/auth');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

router.use(isAuthenticated);
router.use(checkSubscription);

function getCurrencySymbol(curr) {
    const symbols = { USD: '$', GBP: '£', PKR: 'Rs ', INR: '₹', EUR: '€', AED: 'د.إ ' };
    return symbols[curr] || '$';
}

function getDateRange(period) {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
}

// MAIN DASHBOARD (Super Fast Parallel Queries)
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const currencySymbol = getCurrencySymbol(req.user.currency);
        const period = req.query.period || 'today';
        const { start, end } = getDateRange(period);

        const periodQuery = { owner: userId, createdAt: { $gte: start, $lte: end } };

        // Run all DB queries in PARALLEL using Promise.all + .lean() for maximum speed
        const [products, employees, recentSales, allPeriodSales, lastSold] = await Promise.all([
            Product.find({ owner: userId }).sort({ name: 1 }).lean(),
            Employee.find({ owner: userId }).sort({ name: 1 }).lean(),
            Sale.find(periodQuery).sort({ createdAt: -1 }).limit(10).lean(),
            Sale.find(periodQuery).lean(),
            Sale.findOne({ owner: userId }).sort({ createdAt: -1 }).lean()
        ]);

        let totalSales = 0, totalInvestment = 0, totalProfit = 0, onlineOrders = 0, localSales = 0;

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
            totalSales, totalProfit, totalInvestment, roi, profitMargin,
            salesPercent: 100, profitPercent: 100, investmentPercent: 100,
            onlineOrders, localSales, onlineChangePercent: 0, localChangePercent: 0
        };

        const recentUpdates = recentSales.map(s => ({
            customerName: s.employeeName !== 'Self' ? s.employeeName : req.user.name,
            action: `sold ${s.quantity}x ${s.productName}`,
            timeAgo: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        const periodLabel = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year' }[period] || 'Today';

        res.render('dashboard/index', {
            title: 'Dashboard - Sales Dashboard',
            activePage: 'dashboard',
            pageTitle: 'Dashboard',
            stats, recentSales, recentUpdates, products, employees,
            lastSold: lastSold ? {
                productName: lastSold.productName,
                sellingPrice: lastSold.sellingPrice,
                costPrice: lastSold.costPrice,
                profit: lastSold.profit,
                timeAgo: new Date(lastSold.createdAt).toLocaleString()
            } : null,
            currencySymbol, currentPeriod: period, periodLabel
        });

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Error loading dashboard: ' + err.message);
    }
});

// ANALYTICS PAGE
router.get('/analytics', async (req, res) => {
    try {
        const userId = req.user._id;
        const currencySymbol = getCurrencySymbol(req.user.currency);
        const period = req.query.period || 'month';
        const { start, end } = getDateRange(period);

        const allSales = await Sale.find({ owner: userId, createdAt: { $gte: start, $lte: end } }).lean();

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
            analytics: { totalRevenue, netProfit, totalOrders: allSales.length, avgProfitMargin, onlineRevenue, localRevenue },
            chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            salesData: [0, 0, 0, 0, 0, 0, totalRevenue],
            profitData: [0, 0, 0, 0, 0, 0, netProfit],
            dailySalesData: [0, 0, 0, 0, 0, 0, totalRevenue],
            topProducts: [],
            employeePerformance: [],
            currencySymbol, currentPeriod: period
        });
    } catch (err) {
        res.status(500).send('Error loading analytics');
    }
});

// EMPLOYEES PAGE
router.get('/employees', async (req, res) => {
    try {
        const employees = await Employee.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean();
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

// MESSAGES / NOTIFICATIONS PAGE (Fixes "Messages page not opening")
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
        
        // Mark as read when viewing messages inbox
        await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });

        res.render('dashboard/notifications', {
            title: 'Messages & Notifications - Sales Dashboard',
            activePage: 'messages',
            pageTitle: 'Messages Inbox',
            notifications
        });
    } catch (err) {
        res.render('dashboard/notifications', {
            title: 'Messages & Notifications - Sales Dashboard',
            activePage: 'messages',
            pageTitle: 'Messages Inbox',
            notifications: []
        });
    }
});

module.exports = router;