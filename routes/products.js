const express = require('express');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, region, search, sort = 'createdAt' } = req.query;

    let query = { isActive: true };

    // Filter by category
    if (categorie) {
      query.categorie = categorie;
    }

    // Filter by region
    if (region) {
      query.region = region;
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

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(4);
    res.json({
      status: 'success',
      data: { products }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erreur' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('categorie', { isActive: true });
    res.json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erreur' });
  }
});

// @route   GET /api/products/regions
// @desc    Get all regions
// @access  Public
router.get('/regions', async (req, res) => {
  try {
    const regions = await Product.distinct('region', { isActive: true });
    res.json({
      status: 'success',
      data: { regions }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erreur' });
  }
});

// @route   GET /api/products/my-products
// @desc    Get products of current vendor
// @access  Private (Vendeur)
router.get('/my-products', protect, async (req, res) => {
  try {
    const products = await Product.find({ vendeur: req.user.id }).sort({ createdAt: -1 });
    res.json({
      status: 'success',
      data: { products }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de vos produits'
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
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Produit non trouvé'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du produit'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Vendeur)
router.post('/', protect, authorize('admin', 'vendeur'), upload.array('images', 5), async (req, res) => {
  try {
    const { nom, description, descriptionCourte, descriptionLongue, prix, ancienPrix, categorie, region, stock, uniteMesure, caracteristiques } = req.body;

    // Convert base URL for images if they are uploaded
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      // Fallback for URLs if sent as array or string
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.create({
      nom,
      description,
      descriptionCourte,
      descriptionLongue,
      prix,
      ancienPrix,
      categorie,
      region,
      images: imageUrls,
      stock,
      uniteMesure,
      caracteristiques: Array.isArray(caracteristiques) ? caracteristiques : (caracteristiques ? [caracteristiques] : []),
      vendeur: req.user.id
    });

    res.status(201).json({
      status: 'success',
      message: 'Produit créé avec succès',
      data: { product }
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du produit'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Owner/Admin)
router.put('/:id', protect, authorize('admin', 'vendeur'), upload.array('images', 5), async (req, res) => {
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

    // Handle new images if uploaded
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      // If we want to append or replace, here we replace
      updateData.images = newImages;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      message: 'Produit mis à jour avec succès',
      data: { product }
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
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
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'ID invalide'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression du produit'
    });
  }
});

module.exports = router; 