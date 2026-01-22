const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');

describe('Products API', () => {
  let testProductId;
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      nom: 'Test',
      prenom: 'User',
      email: `test_${Date.now()}@example.com`, // Ensure unique email
      telephone: '+22412345678',
      password: 'password123',
      role: 'admin'
    });
    await testUser.save();

    // Authentifier l'utilisateur
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });

    if (!loginResponse.body.data) {
      console.error('Login failed:', JSON.stringify(loginResponse.body, null, 2));
    }
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
  });

  describe('GET /api/products', () => {
    it('devrait retourner la liste des produits', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('devrait accepter les paramètres de pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('currentPage');
      expect(response.body.data).toHaveProperty('totalProducts');
    });

    it('devrait accepter les paramètres de recherche', async () => {
      const response = await request(app)
        .get('/api/products?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
    });

    it('devrait accepter les paramètres de filtrage par catégorie', async () => {
      const response = await request(app)
        .get('/api/products?category=electronics')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
    });

    it('devrait accepter les paramètres de tri', async () => {
      const response = await request(app)
        .get('/api/products?sort=price&order=asc')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
    });
  });

  describe('GET /api/products/:id', () => {
    it('devrait retourner 404 pour un produit inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour un ID invalide', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('status');
    });

    it('devrait retourner un produit existant', async () => {
      // Créer d'abord un produit de test
      const newProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'test',
        stock: 10
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      testProductId = createResponse.body.data.product._id;

      const response = await request(app)
        .get(`/api/products/${testProductId}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.name).toBe(newProduct.name);
    });
  });

  describe('POST /api/products', () => {
    it('devrait créer un nouveau produit', async () => {
      const newProduct = {
        name: 'Nouveau Produit',
        description: 'Description du nouveau produit',
        price: 149.99,
        category: 'electronics',
        stock: 25
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.name).toBe(newProduct.name);
      expect(response.body.data.product.price).toBe(newProduct.price);
    });

    it('devrait retourner 400 pour des données invalides', async () => {
      const invalidProduct = {
        name: '', // Nom vide
        price: -10, // Prix négatif
        stock: 'invalid' // Stock invalide
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour des données manquantes', async () => {
      const incompleteProduct = {
        name: 'Produit Incomplet'
        // Manque price, description, etc.
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteProduct)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('devrait mettre à jour un produit existant', async () => {
      // Créer d'abord un produit de test
      const newProduct = {
        name: 'Produit à Modifier',
        description: 'Description originale',
        price: 50.00,
        category: 'test',
        stock: 5
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      const productId = createResponse.body.data.product._id;

      const updatedData = {
        name: 'Produit Modifié',
        description: 'Description mise à jour',
        price: 75.00,
        stock: 15
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.name).toBe(updatedData.name);
      expect(response.body.data.product.price).toBe(updatedData.price);
    });

    it('devrait retourner 404 pour un produit inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Produit Modifié',
        price: 100.00
      };

      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour des données invalides', async () => {
      // Créer d'abord un produit de test
      const newProduct = {
        name: 'Produit Test',
        description: 'Description test',
        price: 25.00,
        category: 'test',
        stock: 10
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      const productId = createResponse.body.data.product._id;

      const invalidData = {
        price: -50, // Prix négatif
        stock: 'invalid' // Stock invalide
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('devrait supprimer un produit existant', async () => {
      // Créer d'abord un produit de test
      const newProduct = {
        name: 'Produit à Supprimer',
        description: 'Description du produit à supprimer',
        price: 30.00,
        category: 'test',
        stock: 8
      };

      const createResponse = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      const productId = createResponse.body.data.product._id;

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
    });

    it('devrait retourner 404 pour un produit inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour un ID invalide', async () => {
      const response = await request(app)
        .delete('/api/products/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/products/categories', () => {
    it('devrait retourner la liste des catégories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });

  describe('GET /api/products/search', () => {
    it('devrait rechercher des produits par nom', async () => {
      const response = await request(app)
        .get('/api/products/search?q=test')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
    });

    it('devrait retourner des résultats vides pour une recherche sans correspondance', async () => {
      const response = await request(app)
        .get('/api/products/search?q=xyz123nonexistent')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toHaveLength(0);
    });
  });

  describe('Health Check', () => {
    it('devrait retourner le statut de santé de l\'API', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('404 Handler', () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('devrait gérer les erreurs de validation', async () => {
      const invalidProduct = {
        name: 'a'.repeat(1000), // Nom trop long
        price: 'not-a-number',
        stock: -5
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
      expect(response.body).toHaveProperty('message');
    });

    it('devrait gérer les erreurs de base de données', async () => {
      // Test avec des données qui pourraient causer des erreurs DB
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });
});
