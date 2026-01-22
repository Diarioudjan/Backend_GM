const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTestAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Supprimer l'ancien admin si existe
        await User.deleteOne({ email: 'test@admin.com' });

        // Créer nouvel admin
        const admin = await User.create({
            nom: 'Admin',
            prenom: 'Test',
            email: 'test@admin.com',
            password: 'admin123',
            telephone: '+224620000001',
            role: 'admin',
            isVerified: true
        });

        console.log('✅ Compte admin créé avec succès !');
        console.log('📧 Email: test@admin.com');
        console.log('🔑 Mot de passe: admin123');
        console.log('👤 Rôle:', admin.role);

        // Créer aussi un client test
        await User.deleteOne({ email: 'test@client.com' });

        const client = await User.create({
            nom: 'Client',
            prenom: 'Test',
            email: 'test@client.com',
            password: 'client123',
            telephone: '+224620000002',
            role: 'client',
            isVerified: true
        });

        console.log('\n✅ Compte client créé avec succès !');
        console.log('📧 Email: test@client.com');
        console.log('🔑 Mot de passe: client123');
        console.log('👤 Rôle:', client.role);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Déconnecté de MongoDB');
    }
};

createTestAdmin();
