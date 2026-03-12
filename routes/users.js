const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Utilisateur non trouvé'
    });
  }

  res.json({
    status: 'success',
    data: { user }
  });
}));

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { nom, prenom, email, telephone, adresses, boutiqueNom, boutiqueDescription, adresse } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Utilisateur non trouvé'
    });
  }

  // Mettre à jour les champs
  if (nom) user.nom = nom;
  if (prenom) user.prenom = prenom;
  if (email) user.email = email;
  if (telephone) user.telephone = telephone;
  if (adresses) user.adresses = adresses;
  else if (adresse) user.adresses = [adresse];

  // Champs spécifiques vendeur
  if (user.role === 'vendeur' || user.role === 'admin') {
    if (boutiqueNom !== undefined) user.boutiqueNom = boutiqueNom;
    if (boutiqueDescription !== undefined) user.boutiqueDescription = boutiqueDescription;
  }

  const updatedUser = await user.save();

  res.json({
    status: 'success',
    message: 'Profil mis à jour avec succès',
    data: { user: updatedUser }
  });
}));

// @desc    Changer le mot de passe
// @route   PUT /api/users/password
// @access  Private
router.put('/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Veuillez fournir l\'ancien et le nouveau mot de passe'
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      status: 'error',
      message: 'Mot de passe actuel incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    status: 'success',
    message: 'Mot de passe mis à jour avec succès'
  });
}));

module.exports = router;