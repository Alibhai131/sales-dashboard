const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(isAuthenticated);
router.use(authorize('superadmin', 'subadmin'));

// Pages
router.get('/buyers', adminController.getBuyers);

// Actions (Supports both /admin/... and /api/admin/... calls)
router.post('/buyers', adminController.addBuyer);
router.post('/subadmins', adminController.addSubAdmin);

router.post('/buyers/:id/approve', adminController.approveBuyer);
router.post('/buyers/:id/reject', adminController.rejectBuyer);
router.post('/buyers/:id/block', adminController.blockBuyer);
router.post('/buyers/:id/unblock', adminController.unblockBuyer);

router.put('/buyers/:id/subscription', adminController.updateSubscription);

router.delete('/buyers/:id', adminController.deleteBuyer);
router.delete('/subadmins/:id', adminController.removeSubAdmin);

module.exports = router;