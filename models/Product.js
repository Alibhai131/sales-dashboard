const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    productNumber: { type: String, required: true },
    costPrice: { type: Number, required: true },   // Investment
    sellingPrice: { type: Number, required: true },// Sale Price
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);