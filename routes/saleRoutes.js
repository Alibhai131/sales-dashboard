const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');

router.post('/add', ensureAuthenticated, checkSubscriptionStatus, saleController.postRecordSale);

module.exports = router;