const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// @desc    Obtenir toutes les catégories
// @route   GET /api/categories
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active } = req.query;
  
  let query = {};
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const categories = await Category.find(query)
    .populate('produits', 'nom prix images')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ ordre: 1, nom: 1 });

  const total = await Category.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCategories: total
    }
  });
}));

// @desc    Obtenir une catégorie par ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('produits', 'nom prix images description stock');

  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  res.json({
    status: 'success',
    data: {
      category
    }
  });
}));

// @desc    Obtenir une catégorie par slug
// @route   GET /api/categories/slug/:slug
// @access  Public
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate('produits', 'nom prix images description stock');

  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  res.json({
    status: 'success',
    data: {
      category
    }
  });
}));

// @desc    Créer une nouvelle catégorie
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const {
    nom,
    description,
    icone,
    image,
    couleur,
    ordre
  } = req.body;

  // Vérifier si la catégorie existe déjà
  const existingCategory = await Category.findOne({ nom });
  if (existingCategory) {
    return res.status(400).json({
      status: 'error',
      message: 'Une catégorie avec ce nom existe déjà'
    });
  }

  const category = new Category({
    nom,
    description,
    icone,
    image,
    couleur,
    ordre
  });

  const createdCategory = await category.save();

  res.status(201).json({
    status: 'success',
    data: {
      category: createdCategory
    }
  });
}));

// @desc    Mettre à jour une catégorie
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  // Vérifier si le nouveau nom existe déjà (sauf pour cette catégorie)
  if (req.body.nom && req.body.nom !== category.nom) {
    const existingCategory = await Category.findOne({ nom: req.body.nom });
    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    status: 'success',
    data: {
      category: updatedCategory
    }
  });
}));

// @desc    Supprimer une catégorie
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  // Vérifier s'il y a des produits dans cette catégorie
  const productsInCategory = await Product.countDocuments({ categorie: category.nom });
  if (productsInCategory > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Impossible de supprimer cette catégorie car elle contient ${productsInCategory} produit(s)`
    });
  }

  await category.remove();

  res.json({
    status: 'success',
    message: 'Catégorie supprimée avec succès'
  });
}));

// @desc    Obtenir les statistiques des catégories
// @route   GET /api/categories/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const totalCategories = await Category.countDocuments();
  const activeCategories = await Category.countDocuments({ isActive: true });

  const categoriesWithProductCount = await Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'nom',
        foreignField: 'categorie',
        as: 'products'
      }
    },
    {
      $project: {
        nom: 1,
        productCount: { $size: '$products' }
      }
    },
    { $sort: { productCount: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    status: 'success',
    data: {
      totalCategories,
      activeCategories,
      topCategories: categoriesWithProductCount
    }
  });
}));

// @desc    Ajouter un produit à une catégorie
// @route   POST /api/categories/:id/products
// @access  Private/Admin
router.post('/:id/products', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Produit non trouvé'
    });
  }

  await category.addProduct(productId);

  res.json({
    status: 'success',
    message: 'Produit ajouté à la catégorie avec succès'
  });
}));

// @desc    Retirer un produit d'une catégorie
// @route   DELETE /api/categories/:id/products/:productId
// @access  Private/Admin
router.delete('/:id/products/:productId', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      status: 'error',
      message: 'Catégorie non trouvée'
    });
  }

  await category.removeProduct(req.params.productId);

  res.json({
    status: 'success',
    message: 'Produit retiré de la catégorie avec succès'
  });
}));

module.exports = router; 