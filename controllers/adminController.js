const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

// 1. GET /admin/buyers
exports.getBuyers = async (req, res) => {
    try {
        const buyers = await User.find({ role: 'buyer' }).sort({ createdAt: -1 });
        const subAdmins = await User.find({ role: 'subadmin' }).sort({ createdAt: -1 });
        const pendingBuyers = await User.find({ role: 'buyer', isApproved: false, isBlocked: false });

        const now = new Date();

        const buyersWithStats = await Promise.all(buyers.map(async (b) => {
            const productCount = await Product.countDocuments({ owner: b._id });
            const employeeCount = await Employee.countDocuments({ owner: b._id });

            // Check if subscription expiry is in the future
            const hasFutureExpiry = b.subscriptionExpiry ? new Date(b.subscriptionExpiry) > now : true;
            const isSubActive = Boolean(b.subscriptionActive) && hasFutureExpiry;

            return {
                ...b.toObject(),
                productCount,
                employeeCount,
                subscriptionActive: isSubActive
            };
        }));

        const adminStats = {
            totalBuyers: buyers.length,
            activeBuyers: buyers.filter(b => b.isApproved && !b.isBlocked).length,
            blockedBuyers: buyers.filter(b => b.isBlocked).length,
            pendingBuyers: pendingBuyers.length
        };

        res.render('admin/buyers', {
            title: 'Manage Buyers - Admin',
            activePage: 'customers',
            pageTitle: 'Manage Customers',
            buyers: buyersWithStats,
            subAdmins,
            pendingBuyers,
            adminStats
        });
    } catch (err) {
        console.error('Admin Panel Error:', err);
        res.status(500).send('Error loading admin panel: ' + err.message);
    }
};

// 2. Add Buyer
exports.addBuyer = async (req, res) => {
    try {
        const { name, email, shopName, password, plan, currency } = req.body;

        if (!name || !email || !password || !shopName) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const expiry = new Date();
        if (plan === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
        else expiry.setMonth(expiry.getMonth() + 1);

        await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            shopName: shopName.trim(),
            password: hashedPassword,
            role: 'buyer',
            currency: currency || 'USD',
            isApproved: true,
            isBlocked: false,
            subscriptionActive: true,
            subscriptionPlan: plan || 'monthly',
            subscriptionExpiry: expiry,
            paymentStatus: 'paid'
        });

        res.status(201).json({ success: true, message: 'Buyer added successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Add Sub Admin
exports.addSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can add Sub-Admins' });
        }

        const count = await User.countDocuments({ role: 'subadmin' });
        if (count >= 2) {
            return res.status(400).json({ success: false, message: 'Maximum 2 Sub-Admins allowed!' });
        }

        const { name, email, password } = req.body;
        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'subadmin',
            isApproved: true,
            isBlocked: false,
            shopName: 'Admin Team'
        });

        res.status(201).json({ success: true, message: 'Sub-Admin created!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Approve / Reject / Block / Unblock
exports.approveBuyer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { $set: { isApproved: true } });
        res.json({ success: true, message: 'Buyer approved!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.rejectBuyer = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Buyer rejected' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.blockBuyer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { $set: { isBlocked: true } });
        res.json({ success: true, message: 'Buyer blocked!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.unblockBuyer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { $set: { isBlocked: false } });
        res.json({ success: true, message: 'Buyer unblocked!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 5. Update Subscription & Expiry (Guaranteed Expiry Update)
exports.updateSubscription = async (req, res) => {
    try {
        const { plan, status, expiresAt } = req.body;
        const buyerId = req.params.id;

        let expiryDate = null;
        if (expiresAt) {
            const parts = expiresAt.split('-').map(Number);
            if (parts.length === 3 && !parts.some(isNaN)) {
                expiryDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
            } else {
                expiryDate = new Date(expiresAt);
            }
        }

        const isFuture = expiryDate ? expiryDate > new Date() : false;
        const isActive = status === 'active' || isFuture;

        const updateData = {
            subscriptionPlan: plan || 'monthly',
            subscriptionActive: isActive,
            paymentStatus: 'paid'
        };

        if (expiryDate) {
            updateData.subscriptionExpiry = expiryDate;
        }

        const buyer = await User.findByIdAndUpdate(buyerId, { $set: updateData }, { new: true });

        if (!buyer) {
            return res.status(404).json({ success: false, message: 'Buyer not found' });
        }

        res.json({ 
            success: true, 
            message: `Subscription updated for ${buyer.name}! Expiry set to ${expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}`,
            buyer 
        });
    } catch (err) {
        console.error('Subscription Update Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Delete Buyer / Sub Admin
exports.deleteBuyer = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can delete buyers' });
        }
        const id = req.params.id;
        await Promise.all([
            User.findByIdAndDelete(id),
            Product.deleteMany({ owner: id }),
            Sale.deleteMany({ owner: id }),
            Employee.deleteMany({ owner: id })
        ]);
        res.json({ success: true, message: 'Buyer and all data deleted!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.removeSubAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can remove Sub-Admins' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Sub-Admin removed!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};