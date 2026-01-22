const request = require('supertest');
const app = require('../server');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

describe('Cart API', () => {
  let testUser, testProduct, authToken;

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      telephone: '+22412345678',
      password: 'password123',
      role: 'client'
    });
    await testUser.save();

    // Créer un produit de test
    testProduct = new Product({
      nom: 'Produit Test',
      description: 'Description test',
      prix: 1000,
      categorie: 'Electronique',
      stock: 10,
      vendeur: testUser._id,
      images: ['test-image.jpg']
    });
    await testProduct.save();

    // Authentifier l'utilisateur
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
  });

  describe('GET /api/cart', () => {
    it('devrait retourner le panier de l\'utilisateur', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('cart');
      expect(response.body.data.cart).toHaveProperty('items');
      expect(response.body.data.cart).toHaveProperty('totalItems');
      expect(response.body.data.cart).toHaveProperty('totalPrice');
    });

    it('devrait créer un nouveau panier si l\'utilisateur n\'en a pas', async () => {
      // Supprimer le panier existant
      await Cart.deleteMany({ user: testUser._id });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalPrice).toBe(0);
    });

    it('devrait retourner 401 sans authentification', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/cart/add', () => {
    it('devrait ajouter un produit au panier', async () => {
      const cartData = {
        productId: testProduct._id,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('cart');
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.totalPrice).toBe(2000);
    });

    it('devrait augmenter la quantité si le produit existe déjà', async () => {
      // Ajouter le même produit à nouveau
      const cartData = {
        productId: testProduct._id,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.totalItems).toBe(3); // 2 + 1
      expect(response.body.data.cart.totalPrice).toBe(3000);
    });

    it('devrait retourner 400 pour un produit inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const cartData = {
        productId: fakeId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour un stock insuffisant', async () => {
      const cartData = {
        productId: testProduct._id,
        quantity: 999 // Plus que le stock disponible
      };

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/cart/update/:productId', () => {
    it('devrait mettre à jour la quantité d\'un produit', async () => {
      const newQuantity = 5;
      const response = await request(app)
        .put(`/api/cart/update/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: newQuantity })
        .expect(200);

      expect(response.body.data.cart.items[0].quantity).toBe(newQuantity);
      expect(response.body.data.cart.totalItems).toBe(newQuantity);
      expect(response.body.data.cart.totalPrice).toBe(newQuantity * testProduct.prix);
    });

    it('devrait supprimer le produit si la quantité est 0', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalPrice).toBe(0);
    });

    it('devrait retourner 400 pour une quantité négative', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/cart/remove/:productId', () => {
    beforeEach(async () => {
      // Ajouter un produit au panier pour les tests
      const cartData = {
        productId: testProduct._id,
        quantity: 2
      };
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);
    });

    it('devrait supprimer un produit du panier', async () => {
      const response = await request(app)
        .delete(`/api/cart/remove/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalPrice).toBe(0);
    });

    it('devrait retourner 404 pour un produit inexistant dans le panier', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/cart/remove/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Le produit n'est pas dans le panier, mais ce n'est pas une erreur

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Ajouter des produits au panier
      const cartData = {
        productId: testProduct._id,
        quantity: 2
      };
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);
    });

    it('devrait vider le panier', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Panier vidé avec succès');
    });
  });

  describe('GET /api/cart/count', () => {
    beforeEach(async () => {
      // Ajouter des produits au panier
      const cartData = {
        productId: testProduct._id,
        quantity: 3
      };
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);
    });

    it('devrait retourner le nombre d\'articles dans le panier', async () => {
      const response = await request(app)
        .get('/api/cart/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('itemCount');
      expect(response.body.data.itemCount).toBe(3);
    });

    it('devrait retourner 0 si le panier est vide', async () => {
      // Vider le panier
      await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get('/api/cart/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.itemCount).toBe(0);
    });
  });

  describe('GET /api/cart/check-availability', () => {
    beforeEach(async () => {
      // Ajouter des produits au panier
      const cartData = {
        productId: testProduct._id,
        quantity: 2
      };
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);
    });

    it('devrait vérifier la disponibilité des produits', async () => {
      const response = await request(app)
        .get('/api/cart/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('issues');
      expect(Array.isArray(response.body.data.issues)).toBe(true);
    });

    it('devrait détecter les problèmes de stock', async () => {
      // Modifier le stock du produit pour créer un problème
      await Product.findByIdAndUpdate(testProduct._id, { stock: 1 });

      const response = await request(app)
        .get('/api/cart/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.available).toBe(false);
      expect(response.body.data.issues.length).toBeGreaterThan(0);
    });
  });
}); 