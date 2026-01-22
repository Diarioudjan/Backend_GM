const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// @desc    Créer une nouvelle commande
// @route   POST /api/orders
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Aucun produit dans la commande'
    });
  }

  // Vérifier que tous les produits existent et sont en stock
  for (let item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: `Produit ${item.name} non trouvé`
      });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Stock insuffisant pour ${item.name}`
      });
    }
  }

  const order = new Order({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentMethod
  });

  const createdOrder = await order.save();

  // Mettre à jour le stock des produits
  for (let item of orderItems) {
    const product = await Product.findById(item.product);
    product.stock -= item.quantity;
    await product.save();
  }

  // Vider le panier après commande
  const cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    await cart.clearCart();
  }

  res.status(201).json({
    status: 'success',
    data: {
      order: createdOrder
    }
  });
}));

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  let query = {};
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'nom prenom email')
    .populate('orderItems.product', 'nom images')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOrders: total
    }
  });
}));

// @desc    Obtenir les commandes de l'utilisateur connecté
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate('orderItems.product', 'nom images')
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    data: {
      orders
    }
  });
}));

// @desc    Obtenir une commande par ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'nom prenom email')
    .populate('orderItems.product', 'nom images prix');

  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  // Vérifier que l'utilisateur est le propriétaire ou admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      status: 'error',
      message: 'Non autorisé à accéder à cette commande'
    });
  }

  res.json({
    status: 'success',
    data: {
      order
    }
  });
}));

// @desc    Mettre à jour le statut d'une commande (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  order.status = status;
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  if (status === 'Livrée') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  res.json({
    status: 'success',
    data: {
      order: updatedOrder
    }
  });
}));

// @desc    Marquer une commande comme payée
// @route   PUT /api/orders/:id/pay
// @access  Private
router.put('/:id/pay', protect, asyncHandler(async (req, res) => {
  const { paymentResult } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = paymentResult;
  order.status = 'Confirmée';

  const updatedOrder = await order.save();

  res.json({
    status: 'success',
    data: {
      order: updatedOrder
    }
  });
}));

// @desc    Annuler une commande
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  // Vérifier que l'utilisateur est le propriétaire ou admin
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      status: 'error',
      message: 'Non autorisé à annuler cette commande'
    });
  }

  // Vérifier que la commande peut être annulée
  if (order.status === 'Livrée' || order.status === 'Annulée') {
    return res.status(400).json({
      status: 'error',
      message: 'Cette commande ne peut pas être annulée'
    });
  }

  order.status = 'Annulée';

  // Remettre les produits en stock
  for (let item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  const updatedOrder = await order.save();

  res.json({
    status: 'success',
    data: {
      order: updatedOrder
    }
  });
}));

// @desc    Obtenir les statistiques des commandes (Admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'nom prenom')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    status: 'success',
    data: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus,
      recentOrders
    }
  });
}));

module.exports = router; 