const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Optional linked worker
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    productNumber: { type: String },
    costPrice: { type: Number, required: true },      // Investment cost
    sellingPrice: { type: Number, required: true },   // Sold price
    quantity: { type: Number, default: 1 },
    totalInvestment: { type: Number, required: true },// costPrice * quantity
    totalSales: { type: Number, required: true },     // sellingPrice * quantity
    profit: { type: Number, required: true },         // totalSales - totalInvestment
    profitMarginPercentage: { type: Number },         // (profit / totalSales) * 100
    roiPercentage: { type: Number },                  // (profit / totalInvestment) * 100
    currency: { type: String, default: 'USD' },
    source: { type: String, enum: ['local', 'ecommerce'], default: 'local' },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Due'], default: 'Paid' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);