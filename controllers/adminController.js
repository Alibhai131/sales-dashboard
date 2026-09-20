const User = require('../models/User');

// Get all buyers list
exports.getBuyers = async (req, res) => {
    try {
        const buyers = await User.find({ role: 'buyer' }).sort({ createdAt: -1 });
        res.render('admin/buyers', { user: req.session.user, buyers });
    } catch (err) {
        console.error(err);
        res.status(500).send('Admin Error');
    }
};

// Approve pending buyer
exports.approveBuyer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { status: 'active', subscriptionStatus: 'active' });
        res.redirect('/admin/buyers');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error approving buyer');
    }
};

// Toggle Block/Unblock Buyer (Enforces Monthly Premium)
exports.toggleBlockBuyer = async (req, res) => {
    try {
        const buyer = await User.findById(req.params.id);
        if (!buyer) return res.status(404).send('Buyer not found');

        const newStatus = buyer.status === 'blocked' ? 'active' : 'blocked';
        const newSubStatus = buyer.subscriptionStatus === 'blocked' ? 'active' : 'blocked';

        buyer.status = newStatus;
        buyer.subscriptionStatus = newSubStatus;
        await buyer.save();

        res.redirect('/admin/buyers');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error blocking buyer');
    }
};