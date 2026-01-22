require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

async function listUsers() {
    await connectDB();

    try {
        const users = await User.find({}, 'nom prenom email role');
        console.log(`\n👥 Total Users Found: ${users.length}`);

        if (users.length === 0) {
            console.log('⚠️ No users found in this database.');
        } else {
            console.log('📋 User List:');
            users.forEach(user => {
                console.log(`- [${user.role}] ${user.prenom} ${user.nom} (${user.email})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:', error.message);
        process.exit(1);
    }
}

listUsers();
