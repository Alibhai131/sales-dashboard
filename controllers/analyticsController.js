const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Monthly breakdown
    const monthlySales = await Sale.aggregate([
      { $match: { userId: userId, saleDate: { $gte: yearStart } } },
      {
        $group: {
          _id: { month: { $month: '$saleDate' } },
          revenue: { $sum: '$totalRevenue' },
          profit: { $sum: '$profit' },
          cost: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$productName',
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Sales by type
    const salesByType = await Sale.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$saleType',
          revenue: { $sum: '$totalRevenue' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Employee performance
    const employeePerformance = await Sale.aggregate([
      { $match: { userId: userId, employeeId: { $ne: null } } },
      {
        $group: {
          _id: '$employeeId',
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Populate employee names
    const Employee = require('../models/Employee');
    for (let ep of employeePerformance) {
      const emp = await Employee.findById(ep._id);
      ep.name = emp ? emp.name : 'Unknown';
    }

    // Daily sales for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailySales = await Sale.aggregate([
      { $match: { userId: userId, saleDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          revenue: { $sum: '$totalRevenue' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Overall stats
    const overallStats = await Sale.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' },
          totalCost: { $sum: '$totalCost' },
          avgMargin: { $avg: '$profitMargin' },
          avgROI: { $avg: '$roi' },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    // Payment status
    const paymentStats = await Sale.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalRevenue' }
        }
      }
    ]);

    res.render('dashboard/analytics', {
      title: 'Analytics',
      monthlySales,
      topProducts,
      salesByType,
      employeePerformance,
      dailySales,
      overallStats: overallStats.length > 0 ? overallStats[0] : {},
      paymentStats,
      user: req.session.user,
      readOnly: res.locals.readOnly || false
    });
  } catch (error) {
    console.error('Analytics error:', error);
    req.flash('error_msg', 'Error loading analytics');
    res.redirect('/dashboard');
  }
};