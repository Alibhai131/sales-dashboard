const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');

router.get('/', ensureAuthenticated, checkSubscriptionStatus, analyticsController.getAnalytics);

module.exports = router;