import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

// Import routes and middleware
import userRoutes from './routes/users';
import { errorHandler, notFoundHandler } from './middleware/validation';
import database from './database/database';

/**
 * Express application setup with comprehensive middleware configuration
 */
class App {
  public app: express.Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    
    this.initializeDirectories();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeDatabase();
    this.initializeErrorHandling();
  }

  /**
   * Create necessary directories
   */
  private initializeDirectories(): void {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Data directory created');
    }
  }

  /**
   * Initialize all middleware
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Compression middleware
    this.app.use(compression());

    // Request logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timestamp middleware
    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'Express CRUD API',
        version: '1.0.0',
        documentation: {
          baseUrl: `${req.protocol}://${req.get('host')}/api`,
          endpoints: {
            users: {
              'GET /api/users': 'Get all users with filtering and pagination',
              'GET /api/users/:id': 'Get user by ID',
              'POST /api/users': 'Create a new user',
              'PUT /api/users/:id': 'Update user by ID (full update)',
              'PATCH /api/users/:id': 'Update user by ID (partial update)',
              'DELETE /api/users/:id': 'Delete user by ID',
              'GET /api/users/stats': 'Get user statistics',
              'POST /api/users/:id/toggle-status': 'Toggle user active status',
              'GET /api/users/search/:term': 'Search users by term',
            },
          },
          queryParameters: {
            filtering: 'department, isActive, minAge, maxAge, search',
            pagination: 'page, limit',
            sorting: 'sortBy, sortOrder',
          },
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Mount API routes
    this.app.use('/api/users', userRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to Express CRUD API',
        documentation: `${req.protocol}://${req.get('host')}/api`,
        health: `${req.protocol}://${req.get('host')}/health`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Initialize database connection and seed data
   */
  private initializeDatabase(): void {
    try {
      // Seed sample data in development
      if (process.env.NODE_ENV !== 'production') {
        database.seedData();
      }
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Handle 404 errors
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log('🚀 Server Configuration:');
      console.log(`   ├── Port: ${this.port}`);
      console.log(`   ├── Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   ├── Database: SQLite (./data/users.db)`);
      console.log(`   └── API Documentation: http://localhost:${this.port}/api`);
      console.log('');
      console.log('📊 Available Endpoints:');
      console.log(`   ├── Health Check: http://localhost:${this.port}/health`);
      console.log(`   ├── API Root: http://localhost:${this.port}/api`);
      console.log(`   └── Users CRUD: http://localhost:${this.port}/api/users`);
      console.log('');
      console.log('✅ Server is running successfully!');
    });

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  /**
   * Graceful shutdown handler
   */
  private gracefulShutdown(signal: string): void {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Close database connection
    database.close();
    console.log('✅ Database connection closed');
    
    // Exit process
    console.log('✅ Server shutdown complete');
    process.exit(0);
  }
}

// Start the application
const app = new App();

// Start server only if this file is run directly
if (require.main === module) {
  app.listen();
}

export default app; 