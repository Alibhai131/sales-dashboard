const express = require('express');
const router = express.Router();
const { isAuthenticated, checkSubscription } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Apply BOTH checks
router.use(isAuthenticated);
router.use(checkSubscription);

// Pages
router.get('/', productController.getProducts);
router.get('/add', productController.getAddProduct);

// API Actions
router.post('/', productController.createProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;