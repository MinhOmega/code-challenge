# Scoreboard API - Deployment Guide

## Prerequisites

Before deploying the Scoreboard API, ensure you have the following:

### System Requirements
- **Node.js**: Version 16.x or higher
- **PostgreSQL**: Version 13.x or higher  
- **Redis**: Version 6.x or higher
- **Docker** (optional but recommended): Version 20.x or higher
- **Git**: For source code management

### Environment Setup
- **CPU**: Minimum 2 cores (4 cores recommended for production)
- **RAM**: Minimum 4GB (8GB recommended for production)
- **Storage**: Minimum 20GB SSD
- **Network**: Stable internet connection with open ports 3000, 5432, 6379

## Quick Start (Development)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd scoreboard-api

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment Variables
Edit the `.env` file with your specific configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration  
DATABASE_URL=postgresql://scoreboard_user:your_password@localhost:5432/scoreboard_db
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_ENABLED=true
GLOBAL_RATE_LIMIT_REQUESTS=100
GLOBAL_RATE_LIMIT_WINDOW=900000

# Security
CLIENT_ORIGIN=http://localhost:3000
MAX_REQUEST_SIZE=1kb
SESSION_SECRET=another-super-secret-key-minimum-32-characters

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

### 3. Database Setup
```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database and user
CREATE DATABASE scoreboard_db;
CREATE USER scoreboard_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scoreboard_db TO scoreboard_user;

-- Connect to the database
\c scoreboard_db;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO scoreboard_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scoreboard_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scoreboard_user;

\q
```

### 4. Run Database Migrations
```bash
# Run the migration script
npm run migrate

# Or run manually
psql -h localhost -U scoreboard_user -d scoreboard_db -f migrations/001_create_users_table.sql
psql -h localhost -U scoreboard_user -d scoreboard_db -f migrations/002_create_score_history_table.sql
psql -h localhost -U scoreboard_user -d scoreboard_db -f migrations/003_create_user_sessions_table.sql
```

### 5. Start Redis
```bash
# Start Redis server
sudo systemctl start redis

# Or start with password
redis-server --requirepass your_redis_password
```

### 6. Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 7. Verify Installation
```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected", 
    "websocket": "running"
  }
}
```

## Docker Deployment (Recommended)

### 1. Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Main API Service
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://scoreboard_user:${DB_PASSWORD}@db:5432/scoreboard_db
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - CLIENT_ORIGIN=${CLIENT_ORIGIN}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scoreboard_db
      POSTGRES_USER: scoreboard_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scoreboard_user -d scoreboard_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx Load Balancer (Optional)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Environment Configuration for Docker

Create `.env.docker`:

```env
# Database
DB_PASSWORD=secure_database_password_123

# Redis
REDIS_PASSWORD=secure_redis_password_123

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-for-production
SESSION_SECRET=another-super-secret-key-minimum-32-characters-for-production

# Client
CLIENT_ORIGIN=https://yourdomain.com
```

### 3. Deploy with Docker
```bash
# Build and start all services
docker-compose --env-file .env.docker up -d

# View logs
docker-compose logs -f api

# Check service status
docker-compose ps
```

## Production Deployment

### 1. Server Preparation

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot
```

#### Install Node.js (via NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Install Redis
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Production Configuration

#### PostgreSQL Production Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database
CREATE DATABASE scoreboard_prod;
CREATE USER scoreboard_prod WITH ENCRYPTED PASSWORD 'very_secure_production_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE scoreboard_prod TO scoreboard_prod;
\c scoreboard_prod;
GRANT ALL ON SCHEMA public TO scoreboard_prod;

# Configure PostgreSQL for production
sudo nano /etc/postgresql/13/main/postgresql.conf
```

Key PostgreSQL settings for production:
```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings  
max_connections = 100
listen_addresses = 'localhost'

# Logging
log_statement = 'mod'
log_duration = on
log_min_duration_statement = 1000

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Redis Production Setup
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf
```

Key Redis settings:
```conf
# Security
requirepass very_secure_redis_password
bind 127.0.0.1

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### 3. SSL/TLS Configuration

#### Install SSL Certificate
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Or use existing certificates
sudo mkdir -p /etc/nginx/ssl
sudo cp your-certificate.crt /etc/nginx/ssl/
sudo cp your-private-key.key /etc/nginx/ssl/
```

#### Nginx Configuration
Create `/etc/nginx/sites-available/scoreboard-api`:

```nginx
upstream api_backend {
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket specific configuration
    location /socket.io/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/scoreboard-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Process Management

#### Install PM2
```bash
npm install -g pm2
```

#### PM2 Configuration
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'scoreboard-api',
    script: 'src/app.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: '/var/log/scoreboard-api/combined.log',
    out_file: '/var/log/scoreboard-api/out.log',
    error_file: '/var/log/scoreboard-api/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance monitoring
    monitoring: true,
    pmx: true,
    
    // Auto-restart settings
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 5,
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_http_endpoint: '/health'
  }]
};
```

#### Start with PM2
```bash
# Create log directory
sudo mkdir -p /var/log/scoreboard-api
sudo chown $USER:$USER /var/log/scoreboard-api

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Monitor application
pm2 monit
```

### 5. Monitoring and Logging

#### Setup Log Rotation
Create `/etc/logrotate.d/scoreboard-api`:

```
/var/log/scoreboard-api/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 user user
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Health Monitoring Script
Create `/usr/local/bin/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/scoreboard-api/health-check.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Health check passed" >> $LOG_FILE
else
    echo "$(date): Health check failed with status $response" >> $LOG_FILE
    # Restart application
    pm2 restart scoreboard-api
    # Send alert (configure your notification method)
    # mail -s "Scoreboard API Health Check Failed" admin@yourdomain.com < /dev/null
fi
```

Add to crontab:
```bash
# Check health every 2 minutes
*/2 * * * * /usr/local/bin/health-check.sh
```

## Environment-Specific Configurations

### Development
- Debug logging enabled
- CORS allows all origins
- Lower rate limits
- Auto-reload on file changes

### Staging
- Production-like configuration
- Limited CORS origins
- Moderate rate limits
- Basic monitoring

### Production
- Minimal logging (warn/error only)
- Strict CORS policy
- Production rate limits
- Full monitoring and alerting
- SSL/TLS enforced
- Database connection pooling
- Redis clustering (if needed)

## Security Checklist

### Pre-Deployment Security
- [ ] Change all default passwords
- [ ] Generate secure JWT secrets (minimum 32 characters)
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable SSL/TLS with strong ciphers
- [ ] Set up fail2ban for intrusion prevention
- [ ] Configure proper CORS origins
- [ ] Enable security headers
- [ ] Set up regular security updates

### Runtime Security
- [ ] Monitor failed authentication attempts
- [ ] Set up rate limiting alerts
- [ ] Monitor suspicious IP addresses
- [ ] Regular security log reviews
- [ ] Automated vulnerability scanning
- [ ] Database backup encryption
- [ ] API endpoint monitoring

## Backup and Recovery

### Database Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/scoreboard"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U scoreboard_prod scoreboard_prod | gzip > $BACKUP_DIR/scoreboard_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "scoreboard_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/backup-db.sh" | crontab -
```

### Redis Backup
Redis automatically creates snapshots based on configuration. Ensure backup files are copied to secure location:

```bash
# Copy Redis snapshots
cp /var/lib/redis/dump.rdb /var/backups/scoreboard/redis_$(date +%Y%m%d).rdb
```

### Application Recovery
```bash
# Quick recovery steps
git pull origin main
npm install
npm run migrate
pm2 reload scoreboard-api
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U scoreboard_prod -d scoreboard_prod -c "SELECT 1;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli -a your_password ping

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

#### Application Issues
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs scoreboard-api

# Restart application
pm2 restart scoreboard-api

# Monitor resources
pm2 monit
```

#### Network Issues
```bash
# Check if port is open
netstat -tlnp | grep :3000

# Test API endpoints
curl -H "Content-Type: application/json" http://localhost:3000/health

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

This deployment guide provides comprehensive instructions for setting up the Scoreboard API in various environments, from development to production, with proper security, monitoring, and backup procedures. 