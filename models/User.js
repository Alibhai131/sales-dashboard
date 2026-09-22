const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    shopName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    businessType: { type: String, default: 'retail' },
    role: { 
        type: String, 
        enum: ['superadmin', 'subadmin', 'buyer'], 
        default: 'buyer' 
    },
    currency: { type: String, default: 'USD' },
    isApproved: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    
    // Subscription
    subscriptionActive: { type: Boolean, default: true },
    subscriptionPlan: { type: String, default: 'monthly' },
    subscriptionExpiry: { type: Date },
    paymentStatus: { type: String, default: 'paid' },
    
    employeeLimit: { type: Number, default: 10 },
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);