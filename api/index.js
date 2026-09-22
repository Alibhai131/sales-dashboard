const app = require('../server');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
    try {
        await connectDB();
    } catch (err) {
        console.error('Serverless DB Connect Warning:', err.message);
    }
    return app(req, res);
};