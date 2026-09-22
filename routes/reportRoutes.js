const express = require('express');
const router = express.Router();
const { isAuthenticated, checkSubscription } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Apply BOTH checks
router.use(isAuthenticated);
router.use(checkSubscription);

router.get('/', reportController.getReports);
router.get('/download/pdf', reportController.downloadPDF);
router.get('/download/csv', reportController.downloadCSV);

module.exports = router;