const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');

router.get('/', ensureAuthenticated, checkSubscriptionStatus, employeeController.getEmployees);
router.post('/add', ensureAuthenticated, checkSubscriptionStatus, employeeController.postAddEmployee);

module.exports = router;