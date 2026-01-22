const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// Configuration des APIs de paiement
const ORANGE_MONEY_CONFIG = {
  apiUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com',
  merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
  apiKey: process.env.ORANGE_MONEY_API_KEY
};

const MTN_MOMO_CONFIG = {
  apiUrl: process.env.MTN_MOMO_API_URL || 'https://api.mtn.com',
  merchantId: process.env.MTN_MOMO_MERCHANT_ID,
  apiKey: process.env.MTN_MOMO_API_KEY
};

// @desc    Initialiser un paiement Orange Money
// @route   POST /api/payments/orange-money
// @access  Private
router.post('/orange-money', protect, asyncHandler(async (req, res) => {
  const { orderId, phoneNumber, amount } = req.body;

  if (!orderId || !phoneNumber || !amount) {
    return res.status(400).json({
      status: 'error',
      message: 'Tous les champs sont requis'
    });
  }

  // Vérifier le format du numéro de téléphone
  const phoneRegex = /^(\+224|224)?[0-9]{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      status: 'error',
      message: 'Format de numéro de téléphone invalide'
    });
  }

  // Vérifier que la commande existe
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  if (order.user.toString() !== req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'Non autorisé'
    });
  }

  if (order.isPaid) {
    return res.status(400).json({
      status: 'error',
      message: 'Cette commande a déjà été payée'
    });
  }

  try {
    // Simulation de l'appel à l'API Orange Money
    // En production, remplacer par l'appel réel à l'API
    const paymentData = {
      merchantId: ORANGE_MONEY_CONFIG.merchantId,
      phoneNumber: phoneNumber.replace(/^(\+224|224)/, '224'),
      amount: amount,
      orderId: orderId,
      description: `Paiement commande #${orderId}`,
      currency: 'GNF',
      callbackUrl: `${process.env.BASE_URL}/api/payments/callback/orange-money`
    };

    // Simuler la réponse de l'API Orange Money
    const paymentResponse = {
      status: 'PENDING',
      transactionId: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Paiement initié avec succès',
      paymentUrl: `https://orange-money.com/pay/${paymentData.transactionId}`
    };

    res.json({
      status: 'success',
      data: {
        payment: paymentResponse,
        order: {
          id: order._id,
          totalPrice: order.totalPrice
        }
      }
    });

  } catch (error) {
    console.error('Erreur Orange Money:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'initialisation du paiement'
    });
  }
}));

// @desc    Initialiser un paiement MTN MoMo
// @route   POST /api/payments/mtn-momo
// @access  Private
router.post('/mtn-momo', protect, asyncHandler(async (req, res) => {
  const { orderId, phoneNumber, amount } = req.body;

  if (!orderId || !phoneNumber || !amount) {
    return res.status(400).json({
      status: 'error',
      message: 'Tous les champs sont requis'
    });
  }

  // Vérifier le format du numéro de téléphone
  const phoneRegex = /^(\+224|224)?[0-9]{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      status: 'error',
      message: 'Format de numéro de téléphone invalide'
    });
  }

  // Vérifier que la commande existe
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      status: 'error',
      message: 'Commande non trouvée'
    });
  }

  if (order.user.toString() !== req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'Non autorisé'
    });
  }

  if (order.isPaid) {
    return res.status(400).json({
      status: 'error',
      message: 'Cette commande a déjà été payée'
    });
  }

  try {
    // Simulation de l'appel à l'API MTN MoMo
    // En production, remplacer par l'appel réel à l'API
    const paymentData = {
      merchantId: MTN_MOMO_CONFIG.merchantId,
      phoneNumber: phoneNumber.replace(/^(\+224|224)/, '224'),
      amount: amount,
      orderId: orderId,
      description: `Paiement commande #${orderId}`,
      currency: 'GNF',
      callbackUrl: `${process.env.BASE_URL}/api/payments/callback/mtn-momo`
    };

    // Simuler la réponse de l'API MTN MoMo
    const paymentResponse = {
      status: 'PENDING',
      transactionId: `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Paiement initié avec succès',
      paymentUrl: `https://mtn-momo.com/pay/${paymentData.transactionId}`
    };

    res.json({
      status: 'success',
      data: {
        payment: paymentResponse,
        order: {
          id: order._id,
          totalPrice: order.totalPrice
        }
      }
    });

  } catch (error) {
    console.error('Erreur MTN MoMo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'initialisation du paiement'
    });
  }
}));

// @desc    Callback Orange Money
// @route   POST /api/payments/callback/orange-money
// @access  Public
router.post('/callback/orange-money', asyncHandler(async (req, res) => {
  const { transactionId, status, orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Commande non trouvée'
      });
    }

    if (status === 'SUCCESS') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: transactionId,
        status: 'completed',
        update_time: new Date().toISOString(),
        payment_method: 'Orange Money'
      };
      order.status = 'Confirmée';
      await order.save();
    }

    res.json({
      status: 'success',
      message: 'Callback traité avec succès'
    });

  } catch (error) {
    console.error('Erreur callback Orange Money:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du traitement du callback'
    });
  }
}));

// @desc    Callback MTN MoMo
// @route   POST /api/payments/callback/mtn-momo
// @access  Public
router.post('/callback/mtn-momo', asyncHandler(async (req, res) => {
  const { transactionId, status, orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Commande non trouvée'
      });
    }

    if (status === 'SUCCESS') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: transactionId,
        status: 'completed',
        update_time: new Date().toISOString(),
        payment_method: 'MTN MoMo'
      };
      order.status = 'Confirmée';
      await order.save();
    }

    res.json({
      status: 'success',
      message: 'Callback traité avec succès'
    });

  } catch (error) {
    console.error('Erreur callback MTN MoMo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du traitement du callback'
    });
  }
}));

// @desc    Vérifier le statut d'un paiement
// @route   GET /api/payments/status/:transactionId
// @access  Private
router.get('/status/:transactionId', protect, asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Simuler la vérification du statut
    // En production, appeler l'API de vérification
    const paymentStatus = {
      transactionId,
      status: 'SUCCESS', // ou 'PENDING', 'FAILED'
      amount: 50000,
      currency: 'GNF',
      timestamp: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: {
        payment: paymentStatus
      }
    });

  } catch (error) {
    console.error('Erreur vérification statut:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification du statut'
    });
  }
}));

// @desc    Obtenir les méthodes de paiement disponibles
// @route   GET /api/payments/methods
// @access  Public
router.get('/methods', asyncHandler(async (req, res) => {
  const paymentMethods = [
    {
      id: 'orange-money',
      name: 'Orange Money',
      description: 'Paiement via Orange Money',
      icon: '🍊',
      isActive: true
    },
    {
      id: 'mtn-momo',
      name: 'MTN MoMo',
      description: 'Paiement via MTN Mobile Money',
      icon: '📱',
      isActive: true
    },
    {
      id: 'card',
      name: 'Carte Bancaire',
      description: 'Paiement par carte bancaire',
      icon: '💳',
      isActive: false // À implémenter plus tard
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Paiement via PayPal',
      icon: '🔵',
      isActive: false // À implémenter plus tard
    }
  ];

  res.json({
    status: 'success',
    data: {
      paymentMethods: paymentMethods.filter(method => method.isActive)
    }
  });
}));

module.exports = router; 