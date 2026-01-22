const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1']
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
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    nom: {
      type: String,
      required: true
    },
    telephone: {
      type: String,
      required: true
    },
    adresse: {
      rue: {
        type: String,
        required: true
      },
      ville: {
        type: String,
        required: true
      },
      codePostal: String,
      pays: {
        type: String,
        default: 'Guinée'
      }
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Orange Money', 'MTN MoMo', 'Carte Bancaire', 'PayPal']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: Date,
  status: {
    type: String,
    required: true,
    enum: ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'],
    default: 'En attente'
  },
  trackingNumber: String,
  notes: String
}, {
  timestamps: true
});

// Calculer le prix total avant sauvegarde
orderSchema.pre('save', function(next) {
  this.itemsPrice = this.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  this.taxPrice = this.itemsPrice * 0.15; // TVA 15%
  this.shippingPrice = this.itemsPrice > 100000 ? 0 : 5000; // Livraison gratuite au-dessus de 100k GNF
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
  next();
});

module.exports = mongoose.model('Order', orderSchema); 