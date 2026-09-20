const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');

router.get('/', ensureAuthenticated, checkSubscriptionStatus, reportController.getReports);
router.get('/download', ensureAuthenticated, checkSubscriptionStatus, reportController.downloadPDF);

module.exports = router;