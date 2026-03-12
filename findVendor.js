const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const findVendor = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const vendor = await User.findOne({ role: 'vendeur' });
        if (vendor) {
            console.log('VENDOR_FOUND');
            console.log('Email:', vendor.email);
        } else {
            console.log('NO_VENDOR_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findVendor();
