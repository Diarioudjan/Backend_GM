const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// @desc    Obtenir le panier de l'utilisateur
// @route   GET /api/cart
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'nom prix images stock isActive');

  if (!cart) {
    // Créer un nouveau panier si l'utilisateur n'en a pas
    cart = new Cart({
      user: req.user.id,
      items: []
    });
    await cart.save();
  }

  // Filtrer les produits inactifs ou en rupture de stock
  cart.items = cart.items.filter(item => 
    item.product && 
    item.product.isActive && 
    item.product.stock > 0
  );

  await cart.save();

  res.json({
    status: 'success',
    data: {
      cart
    }
  });
}));

// @desc    Ajouter un produit au panier
// @route   POST /api/cart/add
// @access  Private
router.post('/add', protect, asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({
      status: 'error',
      message: 'ID du produit requis'
    });
  }

  // Vérifier que le produit existe et est actif
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Produit non trouvé'
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      status: 'error',
      message: 'Ce produit n\'est plus disponible'
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      status: 'error',
      message: 'Stock insuffisant'
    });
  }

  // Trouver ou créer le panier de l'utilisateur
  let cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    cart = new Cart({
      user: req.user.id,
      items: []
    });
  }

  // Ajouter le produit au panier
  await cart.addItem(productId, quantity, {
    prix: product.prix,
    nom: product.nom,
    images: product.images
  });

  // Récupérer le panier mis à jour avec les détails des produits
  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'nom prix images stock');

  res.json({
    status: 'success',
    data: {
      cart: updatedCart
    }
  });
}));

// @desc    Mettre à jour la quantité d'un produit dans le panier
// @route   PUT /api/cart/update/:productId
// @access  Private
router.put('/update/:productId', protect, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (quantity < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'La quantité doit être au moins 1'
    });
  }

  // Vérifier le stock disponible
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Produit non trouvé'
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      status: 'error',
      message: 'Stock insuffisant'
    });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return res.status(404).json({
      status: 'error',
      message: 'Panier non trouvé'
    });
  }

  await cart.updateQuantity(productId, quantity);

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'nom prix images stock');

  res.json({
    status: 'success',
    data: {
      cart: updatedCart
    }
  });
}));

// @desc    Supprimer un produit du panier
// @route   DELETE /api/cart/remove/:productId
// @access  Private
router.delete('/remove/:productId', protect, asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return res.status(404).json({
      status: 'error',
      message: 'Panier non trouvé'
    });
  }

  await cart.removeItem(productId);

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'nom prix images stock');

  res.json({
    status: 'success',
    data: {
      cart: updatedCart
    }
  });
}));

// @desc    Vider le panier
// @route   DELETE /api/cart/clear
// @access  Private
router.delete('/clear', protect, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return res.status(404).json({
      status: 'error',
      message: 'Panier non trouvé'
    });
  }

  await cart.clearCart();

  res.json({
    status: 'success',
    message: 'Panier vidé avec succès'
  });
}));

// @desc    Obtenir le nombre d'articles dans le panier
// @route   GET /api/cart/count
// @access  Private
router.get('/count', protect, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  const itemCount = cart ? cart.totalItems : 0;

  res.json({
    status: 'success',
    data: {
      itemCount
    }
  });
}));

// @desc    Vérifier la disponibilité des produits dans le panier
// @route   GET /api/cart/check-availability
// @access  Private
router.get('/check-availability', protect, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'nom prix stock isActive');

  if (!cart) {
    return res.json({
      status: 'success',
      data: {
        available: true,
        issues: []
      }
    });
  }

  const issues = [];

  for (let item of cart.items) {
    if (!item.product) {
      issues.push({
        productId: item.product,
        issue: 'Produit supprimé'
      });
      continue;
    }

    if (!item.product.isActive) {
      issues.push({
        productId: item.product._id,
        productName: item.product.nom,
        issue: 'Produit non disponible'
      });
    } else if (item.product.stock < item.quantity) {
      issues.push({
        productId: item.product._id,
        productName: item.product.nom,
        issue: `Stock insuffisant (disponible: ${item.product.stock})`
      });
    }
  }

  res.json({
    status: 'success',
    data: {
      available: issues.length === 0,
      issues
    }
  });
}));

module.exports = router; 