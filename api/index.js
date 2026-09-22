const app = require('../server');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
    // Ensure MongoDB is connected before serving requests in serverless mode
    await connectDB();
    return app(req, res);
};