const Product = require('../models/Product');

// GET all products for current user
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        
        res.render('dashboard/products', {
            title: 'Products - Sales Dashboard',
            activePage: 'products',
            pageTitle: 'Products',
            products,
            categories,
            currencySymbol: req.user.currency === 'PKR' ? 'Rs ' : 
                            req.user.currency === 'GBP' ? '£' : 
                            req.user.currency === 'EUR' ? '€' : 
                            req.user.currency === 'INR' ? '₹' : '$'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading products');
    }
};

// GET Add Product page
exports.getAddProduct = (req, res) => {
    res.render('dashboard/add-product', {
        title: 'Add Product - Sales Dashboard',
        activePage: 'addproduct',
        pageTitle: 'Add New Product'
    });
};

// POST Create Product (API)
exports.createProduct = async (req, res) => {
    try {
        const { name, sku, category, costPrice, sellingPrice, stock } = req.body;

        if (!name || costPrice === undefined || sellingPrice === undefined) {
            return res.status(400).json({ success: false, message: 'Name, Cost Price and Selling Price are required' });
        }

        const product = await Product.create({
            name,
            sku: sku || '',
            category: category || 'General',
            costPrice: parseFloat(costPrice),
            sellingPrice: parseFloat(sellingPrice),
            stock: parseInt(stock) || 0,
            owner: req.user._id
        });

        res.status(201).json({ success: true, product, message: 'Product created successfully!' });
    } catch (err) {
        console.error('Create Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};