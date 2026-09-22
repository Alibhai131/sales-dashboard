const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// API: Get dashboard stats
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaySales = await Sale.aggregate([
      { $match: { userId: userId, saleDate: { $gte: todayStart } } },
      { $group: { _id: null, revenue: { $sum: '$totalRevenue' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } }
    ]);

    const unreadNotifications = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      today: todaySales.length > 0 ? todaySales[0] : { revenue: 0, profit: 0, count: 0 },
      unreadNotifications
    });
  } catch (error) {
    res.json({ success: false });
  }
});

// API: Search products
router.get('/products/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.find({
      userId: req.session.user._id,
      name: { $regex: q, $options: 'i' },
      isActive: true
    }).limit(10);
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, products: [] });
  }
});

// API: Get chart data
router.get('/chart-data', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { period } = req.query;
    
    let startDate;
    const now = new Date();

    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const data = await Sale.aggregate([
      { $match: { userId: userId, saleDate: { $gte: startDate } } },
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

    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, data: [] });
  }
});

module.exports = router;