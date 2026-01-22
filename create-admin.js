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

async function createAdmin() {
    await connectDB();

    try {
        const adminEmail = 'diariou@gmail.com';
        const adminExist = await User.findOne({ email: adminEmail });

        if (adminExist) {
            console.log('❌ Admin existe déjà');
            process.exit(0);
        }

        const admin = await User.create({
            nom: 'Diariou',
            prenom: 'Super',
            email: adminEmail,
            telephone: '+224600000000',
            password: 'Admin123',
            role: 'admin',
            isVerified: true
        });

        console.log('✅ Admin créé avec succès');
        console.log({
            nom: admin.nom,
            prenom: admin.prenom,
            email: admin.email,
            role: admin.role
        });
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

createAdmin();
