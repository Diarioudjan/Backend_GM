# Guide de Test - GuineeMakiti Backend

## Configuration des Tests

### Prérequis
- Node.js (version 14 ou supérieure)
- MongoDB installé et en cours d'exécution
- Toutes les dépendances installées (`npm install`)

### Configuration de l'environnement
1. Copiez le fichier d'environnement d'exemple :
   ```bash
   cp env.example .env
   ```

2. Configurez les variables d'environnement dans `.env` :
   ```env
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/guineemakiti
   JWT_SECRET=your_jwt_secret_key_here
   ```

## Exécution des Tests

### Tous les tests
```bash
npm test
```

### Tests spécifiques
```bash
# Tests d'authentification uniquement
npm test -- tests/auth.test.js

# Tests de produits uniquement
npm test -- tests/products.test.js

# Test spécifique par nom
npm test -- --testNamePattern="devrait créer un nouvel utilisateur"
```

### Tests en mode watch
```bash
npm test -- --watch
```

### Tests avec couverture
```bash
npm test -- --coverage
```

## Structure des Tests

### Tests d'Authentification (`tests/auth.test.js`)
- ✅ Création d'utilisateur
- ✅ Validation des données d'inscription
- ✅ Connexion utilisateur
- ✅ Gestion des erreurs d'authentification
- ✅ Récupération des informations utilisateur

### Tests de Produits (`tests/products.test.js`)
- ✅ Récupération de la liste des produits
- ✅ Pagination
- ✅ Recherche de produits
- ✅ Gestion des erreurs 404
- ✅ Health check de l'API
- ✅ Gestion des routes inexistantes

## Configuration Jest

Le projet utilise Jest avec la configuration suivante :
- **Environnement** : Node.js
- **Base de données de test** : MongoDB séparée
- **Nettoyage automatique** : Après chaque test
- **Timeout** : 10 secondes par test

### Fichiers de configuration
- `jest.config.js` : Configuration principale
- `tests/setup.js` : Configuration de la base de données de test

## Base de Données de Test

Les tests utilisent une base de données MongoDB séparée :
- **URI** : `mongodb://localhost:27017/guineemakiti_test`
- **Nettoyage** : Automatique après chaque test
- **Isolation** : Chaque test s'exécute dans un environnement propre

## Dépannage

### Erreurs courantes

1. **MongoDB non connecté**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution** : Démarrez MongoDB

2. **Tests qui échouent à cause de l'authentification**
   ```
   expected 201 "Created", got 401 "Unauthorized"
   ```
   **Solution** : Vérifiez que le middleware d'authentification est correctement configuré

3. **Erreurs de validation**
   ```
   Numéro de téléphone invalide
   ```
   **Solution** : Utilisez le format correct pour les numéros de téléphone (9 chiffres)

### Logs utiles
Les tests affichent des logs informatifs :
- ✅ Connexion à la base de données de test
- ✅ Fermeture de la connexion
- ❌ Erreurs de connexion

## Ajout de Nouveaux Tests

### Structure recommandée
```javascript
describe('Nouvelle API', () => {
  describe('GET /api/nouvelle-route', () => {
    it('devrait retourner les données attendues', async () => {
      const response = await request(app)
        .get('/api/nouvelle-route')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
    });
  });
});
```

### Bonnes pratiques
1. **Isolation** : Chaque test doit être indépendant
2. **Nettoyage** : Utilisez `afterEach` pour nettoyer les données
3. **Assertions claires** : Testez le comportement attendu
4. **Gestion d'erreurs** : Testez les cas d'erreur

## Intégration Continue

Les tests sont configurés pour s'exécuter automatiquement dans un pipeline CI/CD :
- Vérification de la syntaxe
- Tests unitaires
- Tests d'intégration
- Couverture de code

## Support

Pour toute question concernant les tests, consultez :
- La documentation Jest : https://jestjs.io/
- La documentation Supertest : https://github.com/visionmedia/supertest 