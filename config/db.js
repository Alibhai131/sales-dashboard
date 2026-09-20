const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    mongoose.set('strictQuery', true);

    if (isConnected) {
        console.log('=> Using existing database connection');
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = db.connections[0].readyState;
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
    }
};

module.exports = connectDB;