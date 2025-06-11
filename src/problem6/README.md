# Scoreboard API Service Specification

## Overview

This document specifies a secure, real-time scoreboard API service that manages user scores and provides live leaderboard updates. The service is designed to handle score updates from user actions while preventing malicious score manipulation through comprehensive security measures.

## Architecture Overview

### Core Components

1. **Authentication Service** - JWT-based user authentication and authorization
2. **Score Management Service** - Secure score update and validation logic
3. **Leaderboard Service** - Real-time top 10 users ranking
4. **WebSocket Service** - Live scoreboard updates to connected clients
5. **Rate Limiting Service** - Prevents abuse and spam requests
6. **Database Layer** - Optimized data storage and retrieval

### Technology Stack

- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Redis caching
- **Real-time**: WebSocket (Socket.IO)
- **Authentication**: JWT (JSON Web Tokens)
- **Rate Limiting**: Redis-based sliding window
- **Validation**: Joi schema validation
- **Monitoring**: Request logging and performance metrics

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_score BIGINT DEFAULT 0,
    last_action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for leaderboard queries
CREATE INDEX idx_users_score_desc ON users (total_score DESC);
CREATE INDEX idx_users_last_action ON users (last_action_timestamp);
```

### Score History Table
```sql
CREATE TABLE score_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    score_delta INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_metadata JSONB,
    client_timestamp TIMESTAMP NOT NULL,
    server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for audit and analysis
CREATE INDEX idx_score_history_user_time ON score_history (user_id, server_timestamp DESC);
CREATE INDEX idx_score_history_action_type ON score_history (action_type);
```

### Sessions Table (for JWT blacklisting)
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: Authenticate user and receive JWT token

**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "securePassword123"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 123,
            "username": "player1",
            "email": "user@example.com",
            "totalScore": 1500
        }
    }
}
```

#### POST /api/auth/logout
**Purpose**: Invalidate JWT token

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
    "success": true,
    "message": "Successfully logged out"
}
```

### Score Management Endpoints

#### POST /api/scores/update
**Purpose**: Update user score after completing an action

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
    "actionType": "task_completion",
    "scoreIncrease": 100,
    "clientTimestamp": "2024-01-15T10:30:00.000Z",
    "actionMetadata": {
        "taskId": "task_123",
        "difficulty": "medium",
        "completionTime": 45000
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "newTotalScore": 1600,
        "scoreIncrease": 100,
        "currentRank": 5,
        "previousRank": 7
    }
}
```

**Rate Limiting**: 10 requests per minute per user

**Security Measures**:
- JWT token validation
- Action type whitelist validation
- Score increase bounds checking (1-1000 points per action)
- Timestamp validation (prevent replay attacks)
- IP-based rate limiting

### Leaderboard Endpoints

#### GET /api/leaderboard/top10
**Purpose**: Get current top 10 users

**Response**:
```json
{
    "success": true,
    "data": {
        "leaderboard": [
            {
                "rank": 1,
                "username": "champion_player",
                "totalScore": 15000,
                "lastUpdated": "2024-01-15T10:25:00.000Z"
            }
        ],
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "totalUsers": 1250
    }
}
```

**Caching**: Redis cache with 30-second TTL

#### GET /api/scores/user/:userId
**Purpose**: Get specific user's score and rank

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
    "success": true,
    "data": {
        "userId": 123,
        "username": "player1",
        "totalScore": 1600,
        "currentRank": 5,
        "percentileRank": 85.5
    }
}
```

## WebSocket Events

### Client-to-Server Events

#### `join_leaderboard`
**Purpose**: Subscribe to real-time leaderboard updates

**Payload**:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `leave_leaderboard`
**Purpose**: Unsubscribe from leaderboard updates

### Server-to-Client Events

#### `leaderboard_updated`
**Purpose**: Broadcast leaderboard changes to all connected clients

**Payload**:
```json
{
    "type": "leaderboard_update",
    "data": {
        "leaderboard": [...],
        "timestamp": "2024-01-15T10:30:00.000Z",
        "changeType": "score_increase",
        "affectedUser": {
            "username": "player1",
            "newRank": 5,
            "previousRank": 7
        }
    }
}
```

#### `user_score_updated`
**Purpose**: Notify specific user of their score change

**Payload**:
```json
{
    "type": "personal_score_update",
    "data": {
        "newTotalScore": 1600,
        "scoreIncrease": 100,
        "newRank": 5,
        "previousRank": 7
    }
}
```

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: HS256 algorithm with 24-hour expiration
- **Token Refresh**: Automatic refresh for active users
- **Session Management**: Server-side token blacklisting
- **Password Security**: bcrypt with salt rounds = 12

### Rate Limiting Strategy
```javascript
// Rate limiting configuration
const rateLimits = {
    scoreUpdate: { requests: 10, window: 60000 }, // 10 per minute
    leaderboard: { requests: 100, window: 60000 }, // 100 per minute
    auth: { requests: 5, window: 300000 }  // 5 per 5 minutes
};
```

### Input Validation
- **Score Bounds**: 1-1000 points per action
- **Action Types**: Whitelist of valid action types
- **Timestamp Validation**: Prevent replay attacks (±5 minute window)
- **Request Size**: Maximum 1KB request body

### Anti-Fraud Measures
1. **Action Type Validation**: Only predefined action types accepted
2. **Score Increase Limits**: Maximum points per action and per minute
3. **Behavioral Analysis**: Track unusual scoring patterns
4. **IP Monitoring**: Flag suspicious IP addresses
5. **Time-based Validation**: Reject old or future timestamps

## Performance Optimization

### Caching Strategy
- **Leaderboard Cache**: Redis with 30-second TTL
- **User Score Cache**: Redis with 5-minute TTL
- **Database Connection Pooling**: Maximum 20 connections

### Database Optimization
- **Indexed Queries**: Optimized for leaderboard retrieval
- **Partitioning**: Score history partitioned by month
- **Read Replicas**: Separate read/write database instances

### WebSocket Optimization
- **Room Management**: Efficient client grouping
- **Message Batching**: Batch multiple updates
- **Connection Limits**: Maximum 1000 concurrent connections

## Monitoring & Logging

### Application Metrics
- Request latency (p95, p99)
- Error rates by endpoint
- WebSocket connection count
- Database query performance
- Cache hit rates

### Security Monitoring
- Failed authentication attempts
- Rate limit violations
- Suspicious score update patterns
- IP-based anomaly detection

### Logging Strategy
```javascript
// Log levels and destinations
const loggingConfig = {
    info: ['console', 'file'],
    warn: ['console', 'file', 'slack'],
    error: ['console', 'file', 'slack', 'database'],
    security: ['file', 'security-service', 'slack']
};
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Resource created
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `429`: Too many requests (rate limited)
- `500`: Internal server error

### Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "INVALID_SCORE_INCREASE",
        "message": "Score increase must be between 1 and 1000",
        "details": {
            "field": "scoreIncrease",
            "provided": 1500,
            "maxAllowed": 1000
        }
    }
}
```

## Deployment Considerations

### Environment Configuration
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/scoreboard
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379

# WebSocket
WEBSOCKET_ENABLED=true
MAX_WEBSOCKET_CONNECTIONS=1000

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

### Scaling Strategy
- **Horizontal Scaling**: Load balancer with sticky sessions for WebSocket
- **Database Scaling**: Read replicas and connection pooling
- **Cache Scaling**: Redis cluster for high availability
- **CDN Integration**: Static asset delivery optimization

## Improvement Recommendations

### Phase 1 Improvements (Short-term)
1. **Enhanced Analytics**: Detailed user behavior tracking
2. **Admin Dashboard**: Real-time monitoring interface
3. **Backup Strategy**: Automated database backups
4. **API Versioning**: Support for multiple API versions

### Phase 2 Improvements (Medium-term)
1. **Machine Learning**: Fraud detection algorithms
2. **Geographic Distribution**: Multi-region deployment
3. **Advanced Caching**: Intelligent cache warming
4. **Performance Testing**: Automated load testing

### Phase 3 Improvements (Long-term)
1. **Microservices**: Service decomposition for better scalability
2. **Event Sourcing**: Complete audit trail with event sourcing
3. **Real-time Analytics**: Stream processing for instant insights
4. **Mobile SDK**: Native mobile app integration

## Testing Strategy

### Unit Tests
- Service layer business logic
- Utility functions
- Data validation

### Integration Tests
- API endpoint functionality
- Database operations
- WebSocket communication

### Security Tests
- Authentication bypasses
- Rate limiting effectiveness
- Input validation

### Performance Tests
- Load testing with concurrent users
- WebSocket connection limits
- Database query performance

### End-to-End Tests
- Complete user workflows
- Real-time update delivery
- Error handling scenarios

## API Client Example

### JavaScript Client Implementation
```javascript
class ScoreboardClient {
    constructor(apiUrl, token) {
        this.apiUrl = apiUrl;
        this.token = token;
        this.socket = null;
    }

    async updateScore(actionType, scoreIncrease, metadata) {
        const response = await fetch(`${this.apiUrl}/api/scores/update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                actionType,
                scoreIncrease,
                clientTimestamp: new Date().toISOString(),
                actionMetadata: metadata
            })
        });
        return response.json();
    }

    connectToLeaderboard(onUpdate) {
        this.socket = io(`${this.apiUrl}`, {
            auth: { token: this.token }
        });
        
        this.socket.on('leaderboard_updated', onUpdate);
        this.socket.emit('join_leaderboard');
    }
}
```

This specification provides a comprehensive foundation for implementing a secure, scalable, and real-time scoreboard API service. The backend engineering team can use this document to build a robust system that meets all requirements while providing excellent performance and security. 