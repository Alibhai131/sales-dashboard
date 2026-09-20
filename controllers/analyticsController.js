const Sale = require('../models/Sale');

exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const sales = await Sale.find({ buyerId: userId }).sort({ createdAt: 1 });

        // Group sales by month for the current year
        const monthlyData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            sales: new Array(12).fill(0),
            profit: new Array(12).fill(0),
            investment: new Array(12).fill(0)
        };

        const currentYear = new Date().getFullYear();

        sales.forEach(sale => {
            const saleDate = new Date(sale.createdAt);
            if (saleDate.getFullYear() === currentYear) {
                const month = saleDate.getMonth();
                monthlyData.sales[month] += sale.totalSales || 0;
                monthlyData.profit[month] += sale.profit || 0;
                monthlyData.investment[month] += sale.totalInvestment || 0;
            }
        });

        // Calculate best selling products
        const productMap = {};
        sales.forEach(sale => {
            if (!productMap[sale.productName]) {
                productMap[sale.productName] = { count: 0, revenue: 0 };
            }
            productMap[sale.productName].count += sale.quantity;
            productMap[sale.productName].revenue += sale.totalSales;
        });

        const topProducts = Object.entries(productMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.render('dashboard/analytics', {
            user: req.session.user,
            monthlyData: JSON.stringify(monthlyData),
            topProducts,
            year: currentYear
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Analytics Error');
    }
};