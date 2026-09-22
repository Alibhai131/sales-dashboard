const User = require('../models/User');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');

// Buyer Dashboard
exports.buyerDashboard = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const now = new Date();
    
    // Today's date range
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This year
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Aggregations
    const [todaySales, weekSales, monthSales, yearSales] = await Promise.all([
      Sale.aggregate([
        { $match: { userId: userId, saleDate: { $gte: todayStart, $lt: todayEnd } } },
        { $group: { _id: null, revenue: { $sum: '$totalRevenue' }, profit: { $sum: '$profit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { userId: userId, saleDate: { $gte: weekStart } } },
        { $group: { _id: null, revenue: { $sum: '$totalRevenue' }, profit: { $sum: '$profit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { userId: userId, saleDate: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: '$totalRevenue' }, profit: { $sum: '$profit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { userId: userId, saleDate: { $gte: yearStart } } },
        { $group: { _id: null, revenue: { $sum: '$totalRevenue' }, profit: { $sum: '$profit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
      ])
    ]);

    // Recent sales
    const recentSales = await Sale.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('productId');

    // Total products
    const totalProducts = await Product.countDocuments({ userId });
    const totalEmployees = await Employee.countDocuments({ userId });

    // Monthly sales for chart (last 12 months)
    const monthlySales = await Sale.aggregate([
      { $match: { userId: userId, saleDate: { $gte: yearStart } } },
      {
        $group: {
          _id: { $month: '$saleDate' },
          revenue: { $sum: '$totalRevenue' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const extract = (arr) => arr.length > 0 ? arr[0] : { revenue: 0, profit: 0, cost: 0, count: 0 };

    res.render('dashboard/index', {
      title: 'Dashboard',
      today: extract(todaySales),
      week: extract(weekSales),
      month: extract(monthSales),
      year: extract(yearSales),
      recentSales,
      totalProducts,
      totalEmployees,
      monthlySales,
      user: req.session.user,
      readOnly: res.locals.readOnly || false
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/login');
  }
};