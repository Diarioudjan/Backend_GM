const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createVendor = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let vendor = await User.findOne({ email: 'test_vendor@guineemakiti.com' });

        if (vendor) {
            await User.deleteOne({ email: 'test_vendor@guineemakiti.com' });
        }

        vendor = await User.create({
            prenom: 'Test',
            nom: 'Vendeur',
            boutiqueNom: 'Ma Super Boutique',
            email: 'test_vendor@guineemakiti.com',
            password: 'password123',
            role: 'vendeur',
            telephone: '622000000'
        });

        console.log('VENDOR_CREATED');
        console.log('Email: test_vendor@guineemakiti.com');
        console.log('Password: password123');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createVendor();
