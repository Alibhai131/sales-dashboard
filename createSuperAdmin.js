const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sales_dashboard');
        
        const existingAdmin = await User.findOne({ email: 'admin@dashboard.com' });
        if (existingAdmin) {
            console.log('Super Admin already exists!');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            name: 'Super Admin',
            email: 'admin@dashboard.com',
            password: hashedPassword,
            role: 'superadmin',
            status: 'active'
        });

        await admin.save();
        console.log('✅ Super Admin created successfully!');
        console.log('Email: admin@dashboard.com');
        console.log('Password: admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createSuperAdmin();