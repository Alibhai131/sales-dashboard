const express = require('express');
const router = express.Router();

const { isAuthenticated } = require('../middleware/auth');
const saleController = require('../controllers/saleController');

router.use(isAuthenticated);

router.post('/', saleController.createSale);
router.get('/:id', saleController.getSaleById);

module.exports = router;