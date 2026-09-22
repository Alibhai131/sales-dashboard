const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { subscriptionCheck } = require('../middleware/subscriptionCheck');
const analyticsController = require('../controllers/analyticsController');

router.get('/', isAuthenticated, subscriptionCheck, analyticsController.getAnalytics);

module.exports = router;