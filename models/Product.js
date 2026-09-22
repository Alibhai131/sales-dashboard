const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Virtual for profit & margin
productSchema.virtual('profit').get(function() {
    return this.sellingPrice - this.costPrice;
});

productSchema.virtual('margin').get(function() {
    if (this.sellingPrice === 0) return 0;
    return ((this.sellingPrice - this.costPrice) / this.sellingPrice * 100).toFixed(1);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);