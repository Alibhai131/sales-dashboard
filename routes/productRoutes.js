const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { ensureAuthenticated, checkSubscriptionStatus } = require('../middleware/auth');

router.get('/', ensureAuthenticated, checkSubscriptionStatus, productController.getProducts);
router.post('/add', ensureAuthenticated, checkSubscriptionStatus, productController.postAddProduct);

module.exports = router;