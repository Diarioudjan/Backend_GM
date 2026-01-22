const mongoose = require('mongoose');
require('dotenv').config();

// Configuration pour les tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/guineemakiti_test';

// Connexion à la base de données de test
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Base de données de test connectée');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données de test:', error);
    process.exit(1);
  }
});

// Nettoyage après chaque test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Fermeture de la connexion après tous les tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('✅ Base de données de test fermée');
});

// Configuration globale pour les tests
global.console = {
  ...console,
  // Désactiver les logs pendant les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 