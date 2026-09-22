const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // Keep owner as well because your dashboard currently searches by owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        productNumber: {
            type: String,
            default: 'N/A'
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        // These are totals for the entire sale
        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },

        costPrice: {
            type: Number,
            required: true,
            min: 0
        },

        totalRevenue: {
            type: Number,
            required: true,
            min: 0
        },

        totalCost: {
            type: Number,
            required: true,
            min: 0
        },

        profit: {
            type: Number,
            required: true
        },

        roi: {
            type: Number,
            required: true
        },

        profitMargin: {
            type: Number,
            required: true
        },

        saleType: {
            type: String,
            enum: ['local', 'online'],
            default: 'local'
        },

        status: {
            type: String,
            enum: ['Completed', 'Pending', 'Cancelled'],
            default: 'Completed'
        },

        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null
        },

        employeeName: {
            type: String,
            default: 'Self'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);