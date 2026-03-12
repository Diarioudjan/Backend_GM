const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'client@test.com';
        let customer = await User.findOne({ email });

        if (customer) {
            await User.deleteOne({ email });
            console.log('Existing test client deleted.');
        }

        customer = await User.create({
            prenom: 'Moussa',
            nom: 'Camara',
            email: email,
            password: 'password123',
            role: 'client',
            telephone: '624112233',
            adresse: {
                rue: 'Avenue de la République',
                ville: 'Conakry',
                codePostal: '001',
                pays: 'Guinée'
            },
            preferences: {
                newsletter: true,
                notifications: true
            }
        });

        console.log('CUSTOMER_CREATED');
        console.log('Email: ' + email);
        console.log('Password: password123');

        process.exit(0);
    } catch (err) {
        console.error('Error creating customer:', err);
        process.exit(1);
    }
};

createCustomer();
