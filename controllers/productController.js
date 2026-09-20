const Product = require('../models/Product');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({ buyerId: req.session.user.id }).sort({ createdAt: -1 });
        res.render('dashboard/products', { user: req.session.user, products, error: null, success: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching products');
    }
};

// Add New Product
exports.postAddProduct = async (req, res) => {
    const { productName, productNumber, costPrice, sellingPrice, stock } = req.body;
    try {
        const cost = parseFloat(costPrice);
        const selling = parseFloat(sellingPrice);

        const newProduct = new Product({
            buyerId: req.session.user.id,
            productName,
            productNumber,
            costPrice: cost,
            sellingPrice: selling,
            stock: parseInt(stock) || 0,
            status: stock > 0 ? 'In Stock' : 'Out of Stock'
        });

        await newProduct.save();
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        const products = await Product.find({ buyerId: req.session.user.id });
        res.render('dashboard/products', { user: req.session.user, products, error: 'Failed to add product', success: null });
    }
};