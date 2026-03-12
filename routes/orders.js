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

// @desc    Obtenir les commandes pour un vendeur
// @route   GET /api/orders/vendor
// @access  Private/Vendeur
router.get('/vendor', protect, authorize('vendeur', 'admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  // Trouver les produits du vendeur
  const vendorProducts = await Product.find({ vendeur: req.user.id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  let query = {
    'orderItems.product': { $in: productIds }
  };

  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'nom prenom email')
    .populate('orderItems.product', 'nom images vendeur')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  // Filtrer orderItems pour n'inclure que ceux du vendeur si on veut être strict, 
  // mais généralement on montre toute la commande si elle contient un de ses produits
  // Pour GuinéeMakiti, on va filtrer les orderItems pour que le vendeur ne voit que ses produits dans la commande
  const formattedOrders = orders.map(order => {
    const orderObj = order.toObject();
    orderObj.orderItems = orderObj.orderItems.filter(item =>
      productIds.some(id => id.toString() === item.product._id.toString())
    );
    return orderObj;
  });

  const total = await Order.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      orders: formattedOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOrders: total
    }
  });
}));

// @desc    Obtenir les statistiques du vendeur
// @route   GET /api/orders/vendor/stats
// @access  Private/Vendeur
router.get('/vendor/stats', protect, authorize('vendeur', 'admin'), asyncHandler(async (req, res) => {
  const vendorProducts = await Product.find({ vendeur: req.user.id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  const orders = await Order.find({
    'orderItems.product': { $in: productIds },
    isPaid: true
  });

  let totalRevenue = 0;
  let totalSales = 0;

  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (productIds.some(id => id.toString() === item.product.toString())) {
        totalRevenue += (item.price * item.quantity);
        totalSales += item.quantity;
      }
    });
  });

  const pendingOrdersCount = await Order.countDocuments({
    'orderItems.product': { $in: productIds },
    status: 'En attente'
  });

  const lowStockProducts = await Product.countDocuments({
    vendeur: req.user.id,
    stock: { $lt: 10 }
  });

  // Stats par mois (simplifié pour les 6 derniers mois)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStats = await Order.aggregate([
    {
      $match: {
        'orderItems.product': { $in: productIds },
        isPaid: true,
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $unwind: '$orderItems'
    },
    {
      $match: {
        'orderItems.product': { $in: productIds }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    status: 'success',
    data: {
      totalRevenue,
      totalSales,
      pendingOrdersCount,
      lowStockProducts,
      monthlyStats
    }
  });
}));

// @desc    Obtenir les statistiques des commandes (Admin)
// @route   GET /api/orders/stats/overview
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

// @desc    Mettre à jour le statut d'une commande (Admin/Vendeur)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Vendeur
router.put('/:id/status', protect, authorize('admin', 'vendeur'), asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  // Si c'est un vendeur, on vérifie qu'il a au moins un produit dans cette commande
  if (req.user.role === 'vendeur') {
    const vendorProducts = await Product.find({ vendeur: req.user.id }).select('_id');
    const productIds = vendorProducts.map(p => p._id.toString());
    const hasProduct = order.orderItems.some(item => productIds.includes(item.product.toString()));

    if (!hasProduct) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier cette commande'
      });
    }
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

module.exports = router; 