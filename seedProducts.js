const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        let vendor = await User.findOne({ role: 'vendeur' });
        if (!vendor) {
            vendor = await User.create({
                prenom: 'Admin',
                nom: 'Vendeur',
                boutiqueNom: 'Boutique Officielle',
                email: 'admin_vendeur@guineemakiti.com',
                password: 'password123',
                role: 'vendeur',
                telephone: '622112233'
            });
        }

        const products = [
            {
                nom: 'Riz Local de Kindia',
                description: 'Riz local récolté à la main dans les plaines de Kindia.',
                descriptionCourte: 'Riz premium, 100% naturel.',
                descriptionLongue: 'Le riz de Kindia est cultivé selon des méthodes ancestrales. Sans pesticides, il offre une texture unique et un goût incomparable qui accompagnera parfaitement tous vos plats traditionnels.',
                prix: 25000,
                ancienPrix: 30000,
                categorie: 'Alimentation',
                region: 'Basse Guinée',
                stock: 150,
                uniteMesure: 'kg',
                caracteristiques: ['100% Naturel', 'Sans conservateurs', 'Riche en fibres'],
                vendeur: vendor._id,
                images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
            },
            {
                nom: 'Miel Blanc de Labé',
                description: 'Miel de forêt pur, récolté dans les montagnes du Fouta.',
                descriptionCourte: 'Miel onctueux et parfumé.',
                descriptionLongue: 'Réputé pour ses vertus médicinales, le miel blanc de Labé est une perle rare. Sa texture crémeuse et son parfum floral en font le compagnon idéal de vos petits-déjeuners.',
                prix: 85000,
                ancienPrix: 95000,
                categorie: 'Alimentation',
                region: 'Moyenne Guinée',
                stock: 45,
                uniteMesure: 'pot',
                caracteristiques: ['Bio certifié', 'Récolte artisanale'],
                vendeur: vendor._id,
                images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
            },
            {
                nom: 'Café Robusta de Macenta',
                description: 'Café intense aux arômes boisés de la forêt guinéenne.',
                descriptionCourte: 'Café de caractère, torréfaction artisanale.',
                descriptionLongue: 'Cultivé à l\'ombre des grands arbres de Macenta, ce café robusta développe des notes puissantes. Parfait pour les amateurs de café serré et authentique.',
                prix: 55000,
                categorie: 'Alimentation',
                region: 'Guinée Forestière',
                stock: 100,
                uniteMesure: 'sachet 500g',
                caracteristiques: ['Torréfié en Guinée', 'Arôme puissant'],
                vendeur: vendor._id,
                images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
            },
            {
                nom: 'Sac à main en Cuir de Boké',
                description: 'Maroquinerie fine réalisée par les artisans tanneurs.',
                descriptionCourte: 'Cuir véritable, travail fait main.',
                descriptionLongue: 'Ce sac allie tradition et modernité. Fabriqué à partir de cuir de haute qualité tanné végétalement, il témoigne du savoir-faire exceptionnel des artisans de Boké.',
                prix: 450000,
                categorie: 'Artisanat',
                region: 'Basse Guinée',
                stock: 15,
                uniteMesure: 'unité',
                caracteristiques: ['Cuir véritable', 'Fait main'],
                vendeur: vendor._id,
                images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
            }
        ];

        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log('✅ Base de données mise à jour avec des produits premium');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedProducts();
