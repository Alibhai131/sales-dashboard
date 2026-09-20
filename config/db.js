const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sales_dashboard');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        console.log('💡 Note: If local MongoDB is not running, we will switch to MongoDB Atlas (cloud).');
    }
};

module.exports = connectDB;