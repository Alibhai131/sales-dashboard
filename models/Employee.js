const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    roleTitle: { type: String, default: 'Sales Manager' },
    email: { type: String },
    phone: { type: String },
    totalSalesCount: { type: Number, default: 0 },
    totalSalesAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);