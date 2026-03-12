const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  descriptionCourte: {
    type: String,
    trim: true
  },
  descriptionLongue: {
    type: String,
    trim: true
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['Electronique', 'Vêtements', 'Alimentation', 'Maison', 'Beauté', 'Sport', 'Artisanat', 'Textile', 'Cosmétique', 'Autres']
  },
  region: {
    type: String,
    required: [true, 'La région est requise'],
    enum: ['Basse Guinée', 'Moyenne Guinée', 'Haute Guinée', 'Guinée Forestière', 'Conakry', 'Autre']
  },
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  uniteMesure: {
    type: String,
    default: 'kg'
  },
  caracteristiques: [{
    type: String
  }],
  ancienPrix: {
    type: Number
  },
  note: {
    type: Number,
    default: 4.5
  },
  avisCompte: {
    type: Number,
    default: 0
  },
  vendeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema); 