const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');

router.get('/', ensureAuthenticated, checkSubscriptionStatus, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const timeframe = req.query.timeframe || 'today';

        let dateFilter = {};
        const now = new Date();

        if (timeframe === 'today') {
            const startOfDay = new Date(now.setHours(0,0,0,0));
            dateFilter = { createdAt: { $gte: startOfDay } };
        } else if (timeframe === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            dateFilter = { createdAt: { $gte: startOfWeek } };
        } else if (timeframe === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: startOfMonth } };
        } else if (timeframe === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { createdAt: { $gte: startOfYear } };
        }

        const query = { buyerId: userId, ...dateFilter };

        const sales = await Sale.find(query);
        const products = await Product.find({ buyerId: userId });
        const employees = await Employee.find({ buyerId: userId });

        let totalSales = 0;
        let totalInvestment = 0;
        let totalProfit = 0;

        sales.forEach(sale => {
            totalSales += sale.totalSales || 0;
            totalInvestment += sale.totalInvestment || 0;
            totalProfit += sale.profit || 0;
        });

        const avgROI = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0;
        const recentSales = sales.slice(-10).reverse();

        res.render('dashboard/index', {
            user: req.session.user,
            totalSales,
            totalInvestment,
            totalProfit,
            avgROI,
            recentSales,
            products,
            employees,
            employeeCount: employees.length,
            timeframe
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dashboard Error');
    }
});

module.exports = router;