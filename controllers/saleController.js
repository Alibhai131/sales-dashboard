const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');

// Record a new sale
exports.postRecordSale = async (req, res) => {
    const { productId, quantity, employeeId, paymentStatus, source } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const qty = parseInt(quantity) || 1;
        const totalInvestment = product.costPrice * qty;
        const totalSales = product.sellingPrice * qty;
        const profit = totalSales - totalInvestment;
        
        const profitMarginPercentage = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0;
        const roiPercentage = totalInvestment > 0 ? ((profit / totalInvestment) * 100).toFixed(2) : 0;

        const sale = new Sale({
            buyerId: req.session.user.id,
            employeeId: employeeId || null,
            productId: product._id,
            productName: product.productName,
            productNumber: product.productNumber,
            costPrice: product.costPrice,
            sellingPrice: product.sellingPrice,
            quantity: qty,
            totalInvestment,
            totalSales,
            profit,
            profitMarginPercentage,
            roiPercentage,
            currency: req.session.user.currency || 'USD',
            source: source || 'local',
            paymentStatus: paymentStatus || 'Paid'
        });

        await sale.save();

        // Update product stock
        product.stock = Math.max(0, product.stock - qty);
        if (product.stock === 0) product.status = 'Out of Stock';
        await product.save();

        // Update employee total sales if selected
        if (employeeId) {
            await Employee.findByIdAndUpdate(employeeId, {
                $inc: { totalSalesCount: qty, totalSalesAmount: totalSales }
            });
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error recording sale');
    }
};