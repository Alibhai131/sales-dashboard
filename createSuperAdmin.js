const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Delete any existing superadmins to start fresh
        await User.deleteMany({ role: 'superadmin' });

        const superAdminData = {
            name: 'Qasim Shahbaz',         // <-- Your Name
            email: 'qasim@dashboard.com',  // <-- Your New Login Email
            password: 'MySecurePassword123!', // <-- Your New Password
            shopName: 'Main Headquarters',
            role: 'superadmin',
            isApproved: true,
            isBlocked: false,
            currency: 'USD'
        };

        const salt = await bcrypt.genSalt(10);
        superAdminData.password = await bcrypt.hash(superAdminData.password, salt);

        await User.create(superAdminData);
        console.log('✅ Super Admin created successfully!');
        console.log(`   Email: qasim@dashboard.com`);
        console.log(`   Password: MySecurePassword123!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createSuperAdmin();