const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createVendor = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Supprimer l'ancien vendeur si existe
        await User.deleteOne({ email: 'test@vendeur.com' });

        // Créer nouveau vendeur
        const vendor = await User.create({
            nom: 'Vendeur',
            prenom: 'Test',
            email: 'test@vendeur.com',
            password: 'vendeur123',
            telephone: '+224620000003',
            role: 'vendeur',
            isVerified: true
        });

        console.log('✅ Compte vendeur créé avec succès !');
        console.log('📧 Email: test@vendeur.com');
        console.log('🔑 Mot de passe: vendeur123');
        console.log('👤 Rôle:', vendor.role);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Déconnecté de MongoDB');
    }
};

createVendor();
