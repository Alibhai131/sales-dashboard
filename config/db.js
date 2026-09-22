const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI missing from environment variables');
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        isConnected = db.connections[0].readyState === 1;
        console.log(`🍃 MongoDB Connected: ${db.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;