const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la région est requis'],
    trim: true,
    unique: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  capitale: {
    type: String,
    required: [true, 'La capitale est requise']
  },
  superficie: {
    type: Number,
    min: [0, 'La superficie ne peut pas être négative']
  },
  population: {
    type: Number,
    min: [0, 'La population ne peut pas être négative']
  },
  coordonnees: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  image: {
    type: String,
    default: ''
  },
  couleur: {
    type: String,
    default: '#F2C94C' // Jaune doré par défaut
  },
  isActive: {
    type: Boolean,
    default: true
  },
  produits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  specialites: [{
    nom: String,
    description: String,
    image: String
  }],
  traditions: {
    type: String,
    maxlength: [1000, 'La description des traditions ne peut pas dépasser 1000 caractères']
  }
}, {
  timestamps: true
});

// Générer le slug automatiquement
regionSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.nom
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Méthode pour obtenir le nombre de produits dans la région
regionSchema.methods.getProductCount = function() {
  return this.produits.length;
};

// Méthode pour ajouter un produit à la région
regionSchema.methods.addProduct = function(productId) {
  if (!this.produits.includes(productId)) {
    this.produits.push(productId);
  }
  return this.save();
};

// Méthode pour retirer un produit de la région
regionSchema.methods.removeProduct = function(productId) {
  this.produits = this.produits.filter(id => id.toString() !== productId.toString());
  return this.save();
};

// Méthode pour ajouter une spécialité
regionSchema.methods.addSpecialite = function(specialite) {
  this.specialites.push(specialite);
  return this.save();
};

module.exports = mongoose.model('Region', regionSchema); 