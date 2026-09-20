const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['superadmin', 'subadmin', 'buyer'], 
        default: 'buyer' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'blocked', 'read_only'], 
        default: 'pending' // Buyers require admin approval upon registration
    },
    currency: { 
        type: String, 
        enum: ['USD', 'GBP', 'PKR', 'INR', 'EUR', 'AED'], 
        default: 'USD' 
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'blocked'],
        default: 'active'
    },
    subscriptionDueDate: { type: Date },
    maxEmployees: { type: Number, default: 10 }, // Limit to 10 workers per buyer
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);