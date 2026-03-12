const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const categoryRoutes = require('./routes/categories');
const regionRoutes = require('./routes/regions');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

const app = express();

// Connect to database
// connectDB(); // Moved inside conditional

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://guineemakiti.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/regions', regionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'GuineeMakiti API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Connect to database only when running directly
  connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 GuineeMakiti API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;

