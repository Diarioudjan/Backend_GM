const express = require('express');
const router = express.Router();
const Region = require('../models/Region');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// @desc    Obtenir toutes les régions
// @route   GET /api/regions
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active } = req.query;
  
  let query = {};
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const regions = await Region.find(query)
    .populate('produits', 'nom prix images')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ nom: 1 });

  const total = await Region.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      regions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRegions: total
    }
  });
}));

// @desc    Obtenir une région par ID
// @route   GET /api/regions/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id)
    .populate('produits', 'nom prix images description stock');

  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  res.json({
    status: 'success',
    data: {
      region
    }
  });
}));

// @desc    Obtenir une région par slug
// @route   GET /api/regions/slug/:slug
// @access  Public
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const region = await Region.findOne({ slug: req.params.slug })
    .populate('produits', 'nom prix images description stock');

  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  res.json({
    status: 'success',
    data: {
      region
    }
  });
}));

// @desc    Créer une nouvelle région
// @route   POST /api/regions
// @access  Private/Admin
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const {
    nom,
    description,
    capitale,
    superficie,
    population,
    coordonnees,
    image,
    couleur,
    traditions
  } = req.body;

  // Vérifier si la région existe déjà
  const existingRegion = await Region.findOne({ nom });
  if (existingRegion) {
    return res.status(400).json({
      status: 'error',
      message: 'Une région avec ce nom existe déjà'
    });
  }

  const region = new Region({
    nom,
    description,
    capitale,
    superficie,
    population,
    coordonnees,
    image,
    couleur,
    traditions
  });

  const createdRegion = await region.save();

  res.status(201).json({
    status: 'success',
    data: {
      region: createdRegion
    }
  });
}));

// @desc    Mettre à jour une région
// @route   PUT /api/regions/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id);

  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  // Vérifier si le nouveau nom existe déjà (sauf pour cette région)
  if (req.body.nom && req.body.nom !== region.nom) {
    const existingRegion = await Region.findOne({ nom: req.body.nom });
    if (existingRegion) {
      return res.status(400).json({
        status: 'error',
        message: 'Une région avec ce nom existe déjà'
      });
    }
  }

  const updatedRegion = await Region.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    status: 'success',
    data: {
      region: updatedRegion
    }
  });
}));

// @desc    Supprimer une région
// @route   DELETE /api/regions/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id);

  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  // Vérifier s'il y a des produits dans cette région
  const productsInRegion = await Product.countDocuments({ region: region.nom });
  if (productsInRegion > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Impossible de supprimer cette région car elle contient ${productsInRegion} produit(s)`
    });
  }

  await region.remove();

  res.json({
    status: 'success',
    message: 'Région supprimée avec succès'
  });
}));

// @desc    Obtenir les statistiques des régions
// @route   GET /api/regions/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const totalRegions = await Region.countDocuments();
  const activeRegions = await Region.countDocuments({ isActive: true });

  const regionsWithProductCount = await Region.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'nom',
        foreignField: 'region',
        as: 'products'
      }
    },
    {
      $project: {
        nom: 1,
        capitale: 1,
        productCount: { $size: '$products' }
      }
    },
    { $sort: { productCount: -1 } },
    { $limit: 10 }
  ]);

  const totalPopulation = await Region.aggregate([
    { $group: { _id: null, total: { $sum: '$population' } } }
  ]);

  res.json({
    status: 'success',
    data: {
      totalRegions,
      activeRegions,
      totalPopulation: totalPopulation[0]?.total || 0,
      topRegions: regionsWithProductCount
    }
  });
}));

// @desc    Ajouter un produit à une région
// @route   POST /api/regions/:id/products
// @access  Private/Admin
router.post('/:id/products', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const region = await Region.findById(req.params.id);
  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Produit non trouvé'
    });
  }

  await region.addProduct(productId);

  res.json({
    status: 'success',
    message: 'Produit ajouté à la région avec succès'
  });
}));

// @desc    Retirer un produit d'une région
// @route   DELETE /api/regions/:id/products/:productId
// @access  Private/Admin
router.delete('/:id/products/:productId', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id);
  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  await region.removeProduct(req.params.productId);

  res.json({
    status: 'success',
    message: 'Produit retiré de la région avec succès'
  });
}));

// @desc    Ajouter une spécialité à une région
// @route   POST /api/regions/:id/specialites
// @access  Private/Admin
router.post('/:id/specialites', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { nom, description, image } = req.body;

  const region = await Region.findById(req.params.id);
  if (!region) {
    return res.status(404).json({
      status: 'error',
      message: 'Région non trouvée'
    });
  }

  await region.addSpecialite({ nom, description, image });

  res.json({
    status: 'success',
    message: 'Spécialité ajoutée avec succès'
  });
}));

// @desc    Obtenir la carte interactive des régions
// @route   GET /api/regions/map/data
// @access  Public
router.get('/map/data', asyncHandler(async (req, res) => {
  const regions = await Region.find({ isActive: true })
    .select('nom slug capitale coordonnees couleur image specialites');

  const mapData = regions.map(region => ({
    id: region._id,
    name: region.nom,
    slug: region.slug,
    capitale: region.capitale,
    coordinates: region.coordonnees,
    color: region.couleur,
    image: region.image,
    specialites: region.specialites
  }));

  res.json({
    status: 'success',
    data: {
      regions: mapData
    }
  });
}));

module.exports = router; 