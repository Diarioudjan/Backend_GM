const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
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
  icone: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  couleur: {
    type: String,
    default: '#05613E' // Vert foncé par défaut
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ordre: {
    type: Number,
    default: 0
  },
  produits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Générer le slug automatiquement
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.nom
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Méthode pour obtenir le nombre de produits dans la catégorie
categorySchema.methods.getProductCount = function() {
  return this.produits.length;
};

// Méthode pour ajouter un produit à la catégorie
categorySchema.methods.addProduct = function(productId) {
  if (!this.produits.includes(productId)) {
    this.produits.push(productId);
  }
  return this.save();
};

// Méthode pour retirer un produit de la catégorie
categorySchema.methods.removeProduct = function(productId) {
  this.produits = this.produits.filter(id => id.toString() !== productId.toString());
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema); 