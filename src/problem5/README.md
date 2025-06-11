# Express CRUD API with TypeScript

A robust, production-ready Express.js CRUD API built with TypeScript, featuring comprehensive user management with filtering, pagination, validation, and SQLite database integration.

## 🚀 Features

- **Complete CRUD Operations**: Create, Read, Update, Delete users
- **Advanced Filtering**: Filter by department, active status, age range, and search
- **Pagination**: Efficient pagination with configurable page size
- **Data Validation**: Comprehensive input validation using Zod schemas
- **Security**: Helmet, CORS, rate limiting, and sanitization
- **Database**: SQLite with better-sqlite3 for high performance
- **Error Handling**: Centralized error handling with detailed error messages
- **TypeScript**: Full TypeScript support with strict type checking
- **Production Ready**: Compression, logging, graceful shutdown

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 2. Development Setup

```bash
# Run in development mode with hot reload
npm run dev

# Alternative development command
npm run dev:nodemon
```

### 3. Production Setup

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### 4. Initialize Database (Optional)

```bash
# Initialize database with sample data
npm run db:init
```

## 🗄️ Database Schema

The API uses SQLite with the following user schema:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  age INTEGER NOT NULL,
  department TEXT NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Currently, the API does not require authentication (suitable for development/demo purposes).

### Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "timestamp": string,
  "error": string (only on errors)
}
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.25,
  "memory": {...},
  "version": "1.0.0"
}
```

#### 2. API Documentation
```http
GET /api
```

#### 3. Get All Users (with filtering & pagination)
```http
GET /api/users?page=1&limit=10&department=Engineering&isActive=true
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `department` (string): Filter by department
- `isActive` (boolean): Filter by active status
- `minAge` (number): Minimum age filter
- `maxAge` (number): Maximum age filter
- `search` (string): Search in firstName, lastName, or email
- `sortBy` (string): Sort field (id, email, firstName, lastName, age, department, createdAt)
- `sortOrder` (string): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [...users],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Get User by ID
```http
GET /api/users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "department": "Engineering",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 5. Create User
```http
POST /api/users
Content-Type: application/json

{
  "email": "jane.doe@company.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "age": 28,
  "department": "Marketing",
  "isActive": true
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `firstName`: 1-50 characters
- `lastName`: 1-50 characters
- `age`: Integer between 18-100
- `department`: 1-100 characters
- `isActive`: Boolean (optional, default: true)

#### 6. Update User (Full Update)
```http
PUT /api/users/:id
Content-Type: application/json

{
  "email": "jane.smith@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "age": 29,
  "department": "Engineering",
  "isActive": true
}
```

#### 7. Update User (Partial Update)
```http
PATCH /api/users/:id
Content-Type: application/json

{
  "department": "Sales",
  "age": 30
}
```

#### 8. Delete User
```http
DELETE /api/users/:id
```

#### 9. Get User Statistics
```http
GET /api/users/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalUsers": 25,
    "activeUsers": 22,
    "departments": ["Engineering", "Marketing", "Sales", "HR"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 10. Toggle User Status
```http
POST /api/users/:id/toggle-status
```

#### 11. Search Users
```http
GET /api/users/search/:term?page=1&limit=10
```

## 🧪 Testing the API

### Using cURL

#### Create a user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "age": 25,
    "department": "Engineering"
  }'
```

#### Get all users:
```bash
curl http://localhost:3000/api/users
```

#### Get users with filtering:
```bash
curl "http://localhost:3000/api/users?department=Engineering&isActive=true&page=1&limit=5"
```

#### Update a user:
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age": 26}'
```

#### Delete a user:
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

### Using HTTPie

```bash
# Create user
http POST localhost:3000/api/users email=test@example.com firstName=Test lastName=User age:=25 department=Engineering

# Get users with filters
http GET localhost:3000/api/users department==Engineering isActive==true page==1 limit==5

# Update user
http PATCH localhost:3000/api/users/1 age:=26

# Delete user
http DELETE localhost:3000/api/users/1
```

## 📁 Project Structure

```
src/
├── app.ts                 # Main application setup
├── types/
│   └── user.types.ts      # TypeScript types and Zod schemas
├── database/
│   └── database.ts        # Database connection and operations
├── routes/
│   └── users.ts           # User CRUD routes
├── middleware/
│   └── validation.ts      # Validation and error handling middleware
└── utils/                 # Utility functions (if needed)

data/
└── users.db              # SQLite database file (auto-created)

dist/                     # Compiled JavaScript (after build)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Available Scripts

```json
{
  "dev": "Run development server with hot reload",
  "build": "Compile TypeScript to JavaScript",
  "start": "Start production server",
  "lint": "Run ESLint",
  "lint:fix": "Fix ESLint errors automatically",
  "test": "Run tests",
  "db:init": "Initialize database with sample data"
}
```

## 🔒 Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive validation with Zod
- **Error Handling**: Sanitized error responses
- **SQL Injection Protection**: Prepared statements with better-sqlite3

## 🚀 Performance Features

- **Compression**: Gzip compression for responses
- **Connection Pooling**: Efficient database connections
- **Pagination**: Efficient large dataset handling
- **Indexing**: Database indexes on frequently queried fields
- **Caching Headers**: Appropriate cache control headers

## 📝 Error Handling

The API provides detailed error responses with appropriate HTTP status codes:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Codes
- `USER_NOT_FOUND` (404)
- `EMAIL_ALREADY_EXISTS` (409)
- `VALIDATION_ERROR` (400)
- `DATABASE_ERROR` (500)
- `INTERNAL_SERVER_ERROR` (500)
- `RATE_LIMIT_EXCEEDED` (429)

## 🔄 Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes**: Files auto-reload on save
3. **Test endpoints**: Use curl, Postman, or HTTPie
4. **Build for production**: `npm run build`
5. **Deploy**: `npm start`

## 📈 Monitoring & Logging

- **Request Logging**: Morgan middleware for HTTP request logs
- **Error Logging**: Detailed error logging with stack traces
- **Health Endpoint**: Monitor server health and metrics
- **Memory Usage**: Available in health endpoint

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add validation for new fields
3. Include error handling
4. Update documentation
5. Test all endpoints thoroughly

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Express.js, TypeScript, and SQLite** 