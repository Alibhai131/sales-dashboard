const Notification = require('../models/Notification');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
            
        const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get unread count for header bell badge
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, read: false });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Mark all notifications as read
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
        res.json({ success: true, message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// E-COMMERCE WEBHOOK ENDPOINT (Shopify / WooCommerce / Custom Online Market)
exports.handleEcommerceWebhook = async (req, res) => {
    try {
        const { apiKey, productName, quantity, sellingPrice, customerName } = req.body;

        // Find product by name or SKU
        const product = await Product.findOne({ name: new RegExp(productName, 'i') });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in system' });
        }

        const qty = parseInt(quantity) || 1;
        const totalSell = parseFloat(sellingPrice) * qty;
        const totalCost = product.costPrice * qty;
        const profit = totalSell - totalCost;

        const roi = totalCost > 0 ? Number(((profit / totalCost) * 100).toFixed(2)) : 0;
        const profitMargin = totalSell > 0 ? Number(((profit / totalSell) * 100).toFixed(2)) : 0;

        // Create Online Sale Record
        const sale = await Sale.create({
            userId: product.owner,
            owner: product.owner,
            product: product._id,
            productName: product.name,
            productNumber: product.sku || 'N/A',
            quantity: qty,
            sellingPrice: totalSell,
            costPrice: totalCost,
            totalRevenue: totalSell,
            totalCost: totalCost,
            profit: profit,
            roi: roi,
            profitMargin: profitMargin,
            saleType: 'online',
            status: 'Completed',
            employeeName: customerName || 'Online Customer'
        });

        // Deduct stock
        product.stock = Math.max(0, product.stock - qty);
        product.totalSold = (product.totalSold || 0) + qty;
        await product.save();

        // Create Webhook Notification for Dashboard
        await Notification.create({
            user: product.owner,
            title: '🛒 New Online Order Received!',
            message: `New online sale: ${qty}x ${product.name} for ${totalSell}. Customer: ${customerName || 'Online'}`,
            type: 'order'
        });

        res.status(201).json({ success: true, message: 'Webhook sale recorded successfully!', sale });
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};