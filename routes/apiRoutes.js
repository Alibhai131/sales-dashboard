const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');

// Endpoint for E-Commerce webhooks: POST /api/webhook/sale
router.post('/webhook/sale', async (req, res) => {
    try {
        const { buyerEmail, productName, costPrice, sellingPrice, quantity, paymentStatus } = req.body;

        const user = await User.findOne({ email: buyerEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Buyer user not found' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Buyer subscription blocked' });
        }

        const qty = parseInt(quantity) || 1;
        const cost = parseFloat(costPrice) || 0;
        const selling = parseFloat(sellingPrice) || 0;
        const totalInvestment = cost * qty;
        const totalSales = selling * qty;
        const profit = totalSales - totalInvestment;

        const sale = new Sale({
            buyerId: user._id,
            productName: productName || 'Online Webhook Order',
            costPrice: cost,
            sellingPrice: selling,
            quantity: qty,
            totalInvestment,
            totalSales,
            profit,
            profitMarginPercentage: totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0,
            roiPercentage: totalInvestment > 0 ? ((profit / totalInvestment) * 100).toFixed(2) : 0,
            currency: user.currency || 'USD',
            source: 'ecommerce',
            paymentStatus: paymentStatus || 'Paid'
        });

        await sale.save();

        res.status(200).json({
            success: true,
            message: 'Sale recorded from E-Commerce platform!',
            saleId: sale._id,
            totalSales,
            profit
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;