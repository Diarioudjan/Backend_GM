require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
    try {
        console.log('Attempting to connect to:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
        fs.writeFileSync('db-status.txt', 'SUCCESS');
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        fs.writeFileSync('db-status.txt', `ERROR: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
