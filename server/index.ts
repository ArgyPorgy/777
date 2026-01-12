import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { testConnection } from './db/connection.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { extractWalletAddress, optionalWalletAddress } from './middleware/auth.js';
import gameRoutes from './routes/game.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean);
    
    // In development, allow ngrok and cloudflared domains
    const isNgrokDomain = origin && (
      origin.includes('.ngrok-free.dev') ||
      origin.includes('.ngrok.io') ||
      origin.includes('ngrok.dev')
    );
    
    const isCloudflaredDomain = origin && (
      origin.includes('.trycloudflare.com') ||
      origin.includes('cloudflared')
    );
    
    // Allow Render domains (production)
    const isRenderDomain = origin && (
      origin.includes('.onrender.com') ||
      origin.includes('render.com')
    );
    
    if (NODE_ENV === 'development' || allowedOrigins.includes(origin) || isNgrokDomain || isCloudflaredDomain || isRenderDomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-wallet-address', 'Authorization'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

// Rate limiting - prevent spam/DoS
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: NODE_ENV === 'production' ? 100 : 1000, // 100 requests per minute in production
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please wait before making another request',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for spin endpoint to prevent abuse
const spinLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 1, // 1 spin per 5 seconds
  message: {
    success: false,
    error: 'Too fast',
    message: 'Please wait a few seconds between spins',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).walletAddress || req.ip, // Rate limit per wallet
});

app.use('/api/', generalLimiter);
app.use('/api/game/spin', spinLimiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'error',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/game', extractWalletAddress, gameRoutes);
app.use('/api/leaderboard', optionalWalletAddress, leaderboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Store server reference for graceful shutdown
let server: ReturnType<typeof app.listen> | null = null;

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🔌 Listening on: 0.0.0.0:${PORT} (all interfaces)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown function
function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    
    // Force exit after 3 seconds if server doesn't close
    setTimeout(() => {
      console.log('⚠️ Forcing exit...');
      process.exit(0);
    }, 3000);
  } else {
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

