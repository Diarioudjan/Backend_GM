const express = require('express');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, search, sort = 'createdAt' } = req.query;
    
    let query = { isActive: true };
    
    // Filter by category
    if (categorie) {
      query.categorie = categorie;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .populate('vendeur', 'nom prenom')
      .sort(sort === 'prix' ? { prix: 1 } : { createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Product.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        products,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendeur', 'nom prenom email telephone');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Produit non trouvé'
      });
    }
    
    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du produit'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Vendeur)
router.post('/', protect, authorize('admin', 'vendeur'), async (req, res) => {
  try {
    const { nom, description, prix, categorie, images, stock } = req.body;
    
    const product = await Product.create({
      nom,
      description,
      prix,
      categorie,
      images: images || [],
      stock,
      vendeur: req.user.id
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Produit créé avec succès',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du produit'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Owner/Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Produit non trouvé'
      });
    }
    
    // Check ownership or admin role
    if (product.vendeur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé'
      });
    }
    
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      status: 'success',
      message: 'Produit mis à jour avec succès',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du produit'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Owner/Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Produit non trouvé'
      });
    }
    
    // Check ownership or admin role
    if (product.vendeur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé'
      });
    }
    
    await product.deleteOne();
    
    res.json({
      status: 'success',
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression du produit'
    });
  }
});

module.exports = router; 