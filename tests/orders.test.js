const request = require('supertest');
const app = require('../server');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');

describe('Orders API', () => {
  let testUser, testProduct, testOrder, authToken;

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
      vendeur: testUser._id
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
    await Order.deleteMany({});
    await Cart.deleteMany({});
  });

  describe('POST /api/orders', () => {
    it('devrait créer une nouvelle commande', async () => {
      const orderData = {
        orderItems: [
          {
            product: testProduct._id,
            quantity: 2,
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order.orderItems).toHaveLength(1);
      expect(response.body.data.order.totalPrice).toBeGreaterThan(0);
    });

    it('devrait retourner 400 pour une commande vide', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderItems: [],
          shippingAddress: {},
          paymentMethod: 'Orange Money'
        })
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });

    it('devrait retourner 400 pour un stock insuffisant', async () => {
      const orderData = {
        orderItems: [
          {
            product: testProduct._id,
            quantity: 999, // Plus que le stock disponible
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/orders/myorders', () => {
    it('devrait retourner les commandes de l\'utilisateur connecté', async () => {
      const response = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('devrait retourner 401 sans authentification', async () => {
      const response = await request(app)
        .get('/api/orders/myorders')
        .expect(401);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('devrait retourner une commande spécifique', async () => {
      // Créer une commande de test
      const order = new Order({
        user: testUser._id,
        orderItems: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money'
      });
      await order.save();

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order._id).toBe(order._id.toString());
    });

    it('devrait retourner 404 pour une commande inexistante', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/orders/:id/pay', () => {
    it('devrait marquer une commande comme payée', async () => {
      // Créer une commande non payée
      const order = new Order({
        user: testUser._id,
        orderItems: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money',
        isPaid: false
      });
      await order.save();

      const paymentResult = {
        id: 'test-payment-id',
        status: 'completed',
        update_time: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/orders/${order._id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentResult })
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.data.order.isPaid).toBe(true);
      expect(response.body.data.order.status).toBe('Confirmée');
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('devrait annuler une commande', async () => {
      // Créer une commande annulable
      const order = new Order({
        user: testUser._id,
        orderItems: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money',
        status: 'En attente'
      });
      await order.save();

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.data.order.status).toBe('Annulée');
    });

    it('devrait retourner 400 pour une commande déjà livrée', async () => {
      // Créer une commande livrée
      const order = new Order({
        user: testUser._id,
        orderItems: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.prix,
            name: testProduct.nom,
            image: 'test-image.jpg'
          }
        ],
        shippingAddress: {
          nom: 'Test User',
          telephone: '+22412345678',
          adresse: {
            rue: '123 Test Street',
            ville: 'Conakry',
            pays: 'Guinée'
          }
        },
        paymentMethod: 'Orange Money',
        status: 'Livrée'
      });
      await order.save();

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/orders/stats/overview', () => {
    it('devrait retourner les statistiques des commandes (admin)', async () => {
      // Créer un utilisateur admin
      const adminUser = new User({
        nom: 'Admin',
        prenom: 'User',
        email: 'admin@example.com',
        telephone: '22487654321',
        password: 'password123',
        role: 'admin'
      });
      await adminUser.save();

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        });

      const adminToken = adminLoginResponse.body.data.token;

      const response = await request(app)
        .get('/api/orders/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('ordersByStatus');
      expect(response.body.data).toHaveProperty('recentOrders');
    });

    it('devrait retourner 403 pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .get('/api/orders/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('error');
    });
  });
}); 