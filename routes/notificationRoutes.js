const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Webhook for E-commerce (No auth session needed, verified via payload)
router.post('/webhook/order', notificationController.handleEcommerceWebhook);

// Protected routes for dashboard
router.use(isAuthenticated);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);

module.exports = router;