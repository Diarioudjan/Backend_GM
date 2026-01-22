require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

async function updateToAdmin() {
    await connectDB();

    try {
        const email = 'diariou@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log('✅ Cet utilisateur est déjà admin');
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Rôle mis à jour avec succès pour ${user.email}`);
        console.log(`Nouveau rôle: ${user.role}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error.message);
        process.exit(1);
    }
}

updateToAdmin();
