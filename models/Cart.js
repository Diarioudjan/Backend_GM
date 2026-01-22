const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Le prix ne peut pas être négatif']
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculer le total avant sauvegarde
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalPrice = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  next();
});

// Méthode pour ajouter un produit au panier
cartSchema.methods.addItem = function(productId, quantity = 1, productData) {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: productData.prix,
      name: productData.nom,
      image: productData.images && productData.images.length > 0 ? productData.images[0] : ''
    });
  }
  
  return this.save();
};

// Méthode pour supprimer un produit du panier
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// Méthode pour mettre à jour la quantité
cartSchema.methods.updateQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = quantity;
  }
  return this.save();
};

// Méthode pour vider le panier
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema); 