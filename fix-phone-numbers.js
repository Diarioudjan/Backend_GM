const fs = require('fs');
const path = require('path');

// Fonction pour corriger les numéros de téléphone
function fixPhoneNumbers(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer tous les numéros de téléphone sans le + par des numéros avec le +
  content = content.replace(/telephone:\s*'22412345678'/g, "telephone: '+22412345678'");
  content = content.replace(/telephone:\s*"22412345678"/g, 'telephone: "+22412345678"');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Corrigé: ${filePath}`);
}

// Corriger tous les fichiers de test
const testFiles = [
  'tests/orders.test.js',
  'tests/cart.test.js',
  'tests/products.test.js',
  'tests/auth.test.js'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fixPhoneNumbers(file);
  }
});

console.log('🎉 Tous les numéros de téléphone ont été corrigés !'); 