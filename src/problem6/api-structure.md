# API Project Structure

## Recommended File Structure

```
scoreboard-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── scoreController.js
│   │   └── leaderboardController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── validation.js
│   │   └── antifraud.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ScoreHistory.js
│   │   └── UserSession.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── scoreService.js
│   │   ├── leaderboardService.js
│   │   └── websocketService.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── logger.js
│   │   └── validators.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── scores.js
│   │   └── leaderboard.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── auth.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── security/
├── docs/
│   ├── api-specification.md
│   └── deployment-guide.md
├── migrations/
│   ├── 001_create_users_table.sql
│   ├── 002_create_score_history_table.sql
│   └── 003_create_user_sessions_table.sql
├── package.json
├── .env.example
├── docker-compose.yml
└── README.md
```

## Key Implementation Files

### 1. Main Application (`src/app.js`)

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const leaderboardRoutes = require('./routes/leaderboard');
const websocketService = require('./services/websocketService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN,
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1kb' }));

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// WebSocket handling
websocketService.init(io);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Scoreboard API server running on port ${PORT}`);
});

module.exports = { app, io };
```

### 2. Score Controller (`src/controllers/scoreController.js`)

```javascript
const scoreService = require('../services/scoreService');
const leaderboardService = require('../services/leaderboardService');
const websocketService = require('../services/websocketService');
const logger = require('../utils/logger');

const updateScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { actionType, scoreIncrease, clientTimestamp, actionMetadata } = req.body;

        // Update user score
        const result = await scoreService.updateUserScore(
            userId,
            actionType,
            scoreIncrease,
            clientTimestamp,
            actionMetadata,
            req.ip,
            req.get('User-Agent')
        );

        // Broadcast leaderboard update if user rank changed significantly
        if (Math.abs(result.currentRank - result.previousRank) > 0) {
            const updatedLeaderboard = await leaderboardService.getTopUsers(10);
            websocketService.broadcastLeaderboardUpdate(
                updatedLeaderboard,
                'score_increase',
                {
                    username: req.user.username,
                    newRank: result.currentRank,
                    previousRank: result.previousRank
                }
            );
        }

        // Send personal update to user
        websocketService.sendPersonalUpdate(userId, {
            newTotalScore: result.newTotalScore,
            scoreIncrease: result.scoreIncrease,
            newRank: result.currentRank,
            previousRank: result.previousRank
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        logger.error('Score update error:', error);
        
        if (error.code === 'RATE_LIMITED') {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many score updates. Please try again later.'
                }
            });
        }

        if (error.code === 'INVALID_ACTION_TYPE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ACTION_TYPE',
                    message: 'Invalid action type provided',
                    details: { allowedTypes: error.allowedTypes }
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SCORE_UPDATE_FAILED',
                message: 'Failed to update score'
            }
        });
    }
};

const getUserScore = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Verify user can access this score (own score or admin)
        if (userId !== req.user.id.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cannot access other users scores'
                }
            });
        }

        const scoreData = await scoreService.getUserScoreAndRank(userId);
        
        res.json({
            success: true,
            data: scoreData
        });

    } catch (error) {
        logger.error('Get user score error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_SCORE_FAILED',
                message: 'Failed to fetch user score'
            }
        });
    }
};

module.exports = {
    updateScore,
    getUserScore
};
```

### 3. WebSocket Service (`src/services/websocketService.js`)

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId mapping
    }

    init(io) {
        this.io = io;
        
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                socket.username = decoded.username;
                next();
            } catch (error) {
                logger.warn('WebSocket authentication failed:', error.message);
                next(new Error('Authentication failed'));
            }
        });

        io.on('connection', (socket) => {
            logger.info(`User ${socket.username} connected via WebSocket`);
            this.connectedUsers.set(socket.userId, socket.id);

            socket.on('join_leaderboard', () => {
                socket.join('leaderboard');
                logger.info(`User ${socket.username} joined leaderboard room`);
            });

            socket.on('leave_leaderboard', () => {
                socket.leave('leaderboard');
                logger.info(`User ${socket.username} left leaderboard room`);
            });

            socket.on('disconnect', () => {
                this.connectedUsers.delete(socket.userId);
                logger.info(`User ${socket.username} disconnected`);
            });
        });
    }

    broadcastLeaderboardUpdate(leaderboard, changeType, affectedUser) {
        if (!this.io) return;

        const payload = {
            type: 'leaderboard_update',
            data: {
                leaderboard,
                timestamp: new Date().toISOString(),
                changeType,
                affectedUser
            }
        };

        this.io.to('leaderboard').emit('leaderboard_updated', payload);
        logger.info('Broadcasted leaderboard update to all connected clients');
    }

    sendPersonalUpdate(userId, updateData) {
        if (!this.io) return;

        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            const payload = {
                type: 'personal_score_update',
                data: updateData
            };

            this.io.to(socketId).emit('user_score_updated', payload);
            logger.info(`Sent personal update to user ${userId}`);
        }
    }

    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
}

module.exports = new WebSocketService();
```

### 4. Anti-Fraud Middleware (`src/middleware/antifraud.js`)

```javascript
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const VALID_ACTION_TYPES = [
    'task_completion',
    'level_completed',
    'achievement_unlocked',
    'daily_login',
    'challenge_completed'
];

const MAX_SCORE_PER_ACTION = 1000;
const MAX_SCORE_PER_MINUTE = 5000;
const TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 minutes

const antiFraudValidation = async (req, res, next) => {
    try {
        const { actionType, scoreIncrease, clientTimestamp } = req.body;
        const userId = req.user.id;
        const userKey = `user_score_rate:${userId}`;

        // 1. Validate action type
        if (!VALID_ACTION_TYPES.includes(actionType)) {
            logger.warn(`Invalid action type: ${actionType} from user ${userId}`);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ACTION_TYPE',
                    message: 'Invalid action type',
                    allowedTypes: VALID_ACTION_TYPES
                }
            });
        }

        // 2. Validate score increase bounds
        if (scoreIncrease < 1 || scoreIncrease > MAX_SCORE_PER_ACTION) {
            logger.warn(`Invalid score increase: ${scoreIncrease} from user ${userId}`);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_SCORE_INCREASE',
                    message: `Score increase must be between 1 and ${MAX_SCORE_PER_ACTION}`,
                    details: {
                        provided: scoreIncrease,
                        maxAllowed: MAX_SCORE_PER_ACTION
                    }
                }
            });
        }

        // 3. Validate timestamp (prevent replay attacks)
        const now = Date.now();
        const clientTime = new Date(clientTimestamp).getTime();
        const timeDiff = Math.abs(now - clientTime);
        
        if (timeDiff > TIMESTAMP_TOLERANCE) {
            logger.warn(`Suspicious timestamp from user ${userId}: ${timeDiff}ms difference`);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TIMESTAMP',
                    message: 'Request timestamp is too old or in the future'
                }
            });
        }

        // 4. Check rate limiting for score increases
        const currentMinute = Math.floor(now / 60000);
        const scoreKey = `${userKey}:${currentMinute}`;
        
        const currentMinuteScore = await redis.get(scoreKey) || 0;
        const totalScore = parseInt(currentMinuteScore) + scoreIncrease;
        
        if (totalScore > MAX_SCORE_PER_MINUTE) {
            logger.warn(`Rate limit exceeded for user ${userId}: ${totalScore} points in current minute`);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'SCORE_RATE_LIMITED',
                    message: 'Too many points earned in the last minute'
                }
            });
        }

        // 5. Update rate limiting counter
        await redis.setex(scoreKey, 60, totalScore);

        // 6. Additional behavioral analysis (flag unusual patterns)
        await performBehavioralAnalysis(userId, actionType, scoreIncrease, req.ip);

        next();
    } catch (error) {
        logger.error('Anti-fraud validation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Failed to validate request'
            }
        });
    }
};

const performBehavioralAnalysis = async (userId, actionType, scoreIncrease, ipAddress) => {
    try {
        // Track action patterns
        const patternKey = `behavior:${userId}`;
        const patterns = await redis.get(patternKey);
        
        let behaviorData = patterns ? JSON.parse(patterns) : {
            actions: {},
            ips: {},
            totalActions: 0,
            lastActionTime: 0
        };

        // Update patterns
        behaviorData.actions[actionType] = (behaviorData.actions[actionType] || 0) + 1;
        behaviorData.ips[ipAddress] = (behaviorData.ips[ipAddress] || 0) + 1;
        behaviorData.totalActions += 1;
        behaviorData.lastActionTime = Date.now();

        // Flag suspicious behavior
        const uniqueIps = Object.keys(behaviorData.ips).length;
        const actionVariety = Object.keys(behaviorData.actions).length;
        
        if (uniqueIps > 5 || actionVariety === 1 && behaviorData.totalActions > 100) {
            logger.warn(`Suspicious behavior detected for user ${userId}:`, {
                uniqueIps,
                actionVariety,
                totalActions: behaviorData.totalActions
            });
            
            // Store alert for further investigation
            await redis.setex(`alert:${userId}`, 86400, JSON.stringify({
                type: 'suspicious_behavior',
                userId,
                patterns: behaviorData,
                timestamp: new Date().toISOString()
            }));
        }

        // Store updated patterns (expire after 24 hours)
        await redis.setex(patternKey, 86400, JSON.stringify(behaviorData));
        
    } catch (error) {
        logger.error('Behavioral analysis error:', error);
    }
};

module.exports = {
    antiFraudValidation
};
```

### 5. Package.json

```json
{
    "name": "scoreboard-api",
    "version": "1.0.0",
    "description": "Secure real-time scoreboard API service",
    "main": "src/app.js",
    "scripts": {
        "start": "node src/app.js",
        "dev": "nodemon src/app.js",
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        "lint": "eslint src/",
        "migrate": "node scripts/migrate.js"
    },
    "dependencies": {
        "express": "^4.18.2",
        "socket.io": "^4.7.4",
        "jsonwebtoken": "^9.0.2",
        "bcrypt": "^5.1.1",
        "pg": "^8.11.3",
        "redis": "^4.6.10",
        "joi": "^17.11.0",
        "express-rate-limit": "^7.1.5",
        "helmet": "^7.1.0",
        "cors": "^2.8.5",
        "winston": "^3.11.0",
        "dotenv": "^16.3.1"
    },
    "devDependencies": {
        "nodemon": "^3.0.2",
        "jest": "^29.7.0",
        "supertest": "^6.3.3",
        "eslint": "^8.56.0"
    },
    "engines": {
        "node": ">=16.0.0"
    }
}
```

## Environment Configuration

### .env.example

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/scoreboard
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_ENABLED=true
GLOBAL_RATE_LIMIT_REQUESTS=100
GLOBAL_RATE_LIMIT_WINDOW=900000

# Security
CLIENT_ORIGIN=http://localhost:3000
MAX_REQUEST_SIZE=1kb
SESSION_SECRET=another-super-secret-key

# WebSocket Configuration
WEBSOCKET_ENABLED=true
MAX_WEBSOCKET_CONNECTIONS=1000

# Monitoring and Logging
LOG_LEVEL=info
METRICS_ENABLED=true

# Anti-Fraud Configuration
MAX_SCORE_PER_ACTION=1000
MAX_SCORE_PER_MINUTE=5000
TIMESTAMP_TOLERANCE_MS=300000
```

This structure provides a solid foundation for implementing the scoreboard API with all the security, performance, and scalability features outlined in the specification. 