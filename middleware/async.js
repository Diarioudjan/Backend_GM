/**
 * Middleware pour gérer les erreurs asynchrones
 * Wrapper pour éviter try/catch dans chaque route
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 