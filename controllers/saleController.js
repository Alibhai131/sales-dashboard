const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
exports.createSale = async (req, res) => {
    try {
        const {
            productId,
            quantity,
            sellingPrice,
            saleType,
            employeeId
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Please select a product'
            });
        }

        const qty = Math.max(parseInt(quantity, 10) || 1, 1);
        const enteredSellingPrice = Number(sellingPrice);

        if (!Number.isFinite(enteredSellingPrice) || enteredSellingPrice < 0) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid selling price'
            });
        }

        const userId = req.user._id;

        const product = await Product.findOne({
            _id: productId,
            owner: userId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // The form price is treated as the price per item
        const totalRevenue = enteredSellingPrice * qty;
        const totalCost = Number(product.costPrice) * qty;
        const profit = totalRevenue - totalCost;

        const roi = totalCost > 0
            ? Number(((profit / totalCost) * 100).toFixed(2))
            : 0;

        const profitMargin = totalRevenue > 0
            ? Number(((profit / totalRevenue) * 100).toFixed(2))
            : 0;

        let employeeName = 'Self';
        let employee = null;

        if (employeeId) {
            employee = await Employee.findOne({
                _id: employeeId,
                owner: userId
            });

            if (employee) {
                employeeName = employee.name;
                employee.totalSales = (employee.totalSales || 0) + qty;
                employee.totalRevenue = (employee.totalRevenue || 0) + totalRevenue;
                employee.totalProfit = (employee.totalProfit || 0) + profit;
                employee.monthlySales = (employee.monthlySales || 0) + qty;
                await employee.save();
            }
        }

        product.stock = Math.max((product.stock || 0) - qty, 0);
        product.totalSold = (product.totalSold || 0) + qty;
        await product.save();

        const sale = await Sale.create({
            userId,
            owner: userId,

            product: product._id,
            productName: product.name,
            productNumber: product.sku || 'N/A',

            quantity: qty,

            // Store total values because the dashboard totals these fields
            sellingPrice: totalRevenue,
            costPrice: totalCost,

            totalRevenue,
            totalCost,
            profit,
            roi,
            profitMargin,

            saleType: saleType === 'online' ? 'online' : 'local',
            status: 'Completed',

            employee: employee ? employee._id : null,
            employeeName
        });

        return res.status(201).json({
            success: true,
            message: 'Sale recorded successfully',
            sale
        });

    } catch (error) {
        console.error('Sale Creation Error:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Get single sale details
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id });
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, sale });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};