const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');

router.get('/buyers', ensureAuthenticated, checkRole(['superadmin', 'subadmin']), adminController.getBuyers);
router.get('/buyers/approve/:id', ensureAuthenticated, checkRole(['superadmin', 'subadmin']), adminController.approveBuyer);
router.get('/buyers/toggle-block/:id', ensureAuthenticated, checkRole(['superadmin', 'subadmin']), adminController.toggleBlockBuyer);

module.exports = router;