# GuineeMakiti Backend

Backend API pour la plateforme e-commerce GuineeMakiti.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp env.example .env

# Configurer les variables d'environnement dans .env
```

## 🔧 Configuration

Créez un fichier `.env` avec les variables suivantes :

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/guineemakiti

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏃‍♂️ Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 🧪 Tests

### Prérequis
- MongoDB installé et en cours d'exécution
- Variables d'environnement configurées

### Exécution des tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests spécifiques
npm run test:auth      # Tests d'authentification
npm run test:products  # Tests de produits

# Mode debug
npm run test:debug
```

### Résultats des tests
- ✅ **14 tests passent** sur 14
- ✅ **2 suites de tests** complètes
- ✅ **Tests d'authentification** : 7 tests
- ✅ **Tests de produits** : 7 tests

## 📁 Structure du Projet

```
guineemakiti-backend/
├── config/           # Configuration (base de données, etc.)
├── middleware/       # Middleware Express
├── models/          # Modèles Mongoose
├── routes/          # Routes API
├── tests/           # Tests
│   ├── auth.test.js
│   ├── products.test.js
│   └── setup.js
├── uploads/         # Fichiers uploadés
├── server.js        # Point d'entrée
├── jest.config.js   # Configuration Jest
└── package.json
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/me` - Informations utilisateur

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (Admin/Vendeur)
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### Autres
- `GET /api/health` - Statut de l'API

## 🛡️ Sécurité

- **Helmet** : Headers de sécurité
- **CORS** : Configuration cross-origin
- **Rate Limiting** : Protection contre les attaques DDoS
- **JWT** : Authentification sécurisée
- **Validation** : Validation des données d'entrée

## 📊 Monitoring

- **Morgan** : Logging des requêtes HTTP
- **Compression** : Compression des réponses
- **Error Handling** : Gestion centralisée des erreurs

## 🧪 Tests

### Configuration
- **Jest** : Framework de test
- **Supertest** : Tests d'API
- **MongoDB** : Base de données de test séparée

### Couverture
- Tests d'authentification complets
- Tests d'API produits
- Tests de gestion d'erreurs
- Tests de validation

## 📚 Documentation

- [Guide de Test](./TESTING.md) - Documentation complète des tests
- [API Documentation](./docs/api.md) - Documentation de l'API

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation des tests
- Vérifiez les logs de l'application 