import Database from 'better-sqlite3';
import path from 'path';
import { IUser, ICreateUser, IUpdateUser, IUserFilters, ErrorCodes, ApiError } from '../types/user.types';

/**
 * Database class for managing SQLite database operations
 */
class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'users.db');
    
    // Create data directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Data directory created');
    }
    
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        age INTEGER NOT NULL,
        department TEXT NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users 
      BEGIN 
        UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;

    try {
      this.db.exec(createUsersTable);
      this.db.exec(createTrigger);
      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to initialize database', 500, error);
    }
  }

  /**
   * Create a new user
   */
  createUser(userData: ICreateUser): IUser {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, firstName, lastName, age, department, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.age,
        userData.department,
        (userData.isActive ?? true) ? 1 : 0
      );

      const newUser = this.getUserById(result.lastInsertRowid as number);
      if (!newUser) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to retrieve created user', 500);
      }

      return newUser;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create user', 500, error);
    }
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): IUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    try {
      const user = stmt.get(id) as IUser | undefined;
      return user || null;
    } catch (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to retrieve user', 500, error);
    }
  }

  /**
   * Get users with filtering and pagination
   */
  getUsers(filters: IUserFilters = {}): { users: IUser[]; total: number } {
    const {
      department,
      isActive,
      minAge,
      maxAge,
      search,
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc'
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Build WHERE clause dynamically
    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (isActive !== undefined) {
      whereClause += ' AND isActive = ?';
      params.push(isActive ? 1 : 0);
    }

    if (minAge) {
      whereClause += ' AND age >= ?';
      params.push(minAge);
    }

    if (maxAge) {
      whereClause += ' AND age <= ?';
      params.push(maxAge);
    }

    if (search) {
      whereClause += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countStmt = this.db.prepare(countQuery);
    const { total } = countStmt.get(...params) as { total: number };

    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT * FROM users 
      ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()} 
      LIMIT ? OFFSET ?
    `;
    
    const dataStmt = this.db.prepare(dataQuery);
    const users = dataStmt.all(...params, limit, offset) as IUser[];

    return { users, total };
  }

  /**
   * Update user by ID
   */
  updateUser(id: number, userData: IUpdateUser): IUser | null {
    const existingUser = this.getUserById(id);
    if (!existingUser) {
      throw new ApiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    // Build UPDATE clause dynamically
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        // Convert boolean to number for SQLite
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else {
          params.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return existingUser; // No changes to apply
    }

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    params.push(id);

    try {
      const stmt = this.db.prepare(updateQuery);
      const result = stmt.run(...params);

      if (result.changes === 0) {
        throw new ApiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
      }

      return this.getUserById(id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to update user', 500, error);
    }
  }

  /**
   * Delete user by ID
   */
  deleteUser(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to delete user', 500, error);
    }
  }

  /**
   * Check if user exists by email
   */
  userExistsByEmail(email: string, excludeId?: number): boolean {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const params: any[] = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = this.db.prepare(query);
    const { count } = stmt.get(...params) as { count: number };
    return count > 0;
  }

  /**
   * Get database statistics
   */
  getStats(): { totalUsers: number; activeUsers: number; departments: string[] } {
    const totalUsersStmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const activeUsersStmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE isActive = 1');
    const departmentsStmt = this.db.prepare('SELECT DISTINCT department FROM users ORDER BY department');

    const { count: totalUsers } = totalUsersStmt.get() as { count: number };
    const { count: activeUsers } = activeUsersStmt.get() as { count: number };
    const departments = departmentsStmt.all() as { department: string }[];

    return {
      totalUsers,
      activeUsers,
      departments: departments.map(d => d.department)
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Seed initial data for development/testing
   */
  seedData(): void {
    const users = [
      {
        email: 'john.doe@company.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        department: 'Engineering',
        isActive: true
      },
      {
        email: 'jane.smith@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        age: 28,
        department: 'Marketing',
        isActive: true
      },
      {
        email: 'bob.johnson@company.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        age: 35,
        department: 'Engineering',
        isActive: false
      },
      {
        email: 'alice.brown@company.com',
        firstName: 'Alice',
        lastName: 'Brown',
        age: 32,
        department: 'Sales',
        isActive: true
      }
    ];

    users.forEach(user => {
      try {
        this.createUser(user);
      } catch (error) {
        // Ignore if user already exists
      }
    });

    console.log('✅ Sample data seeded successfully');
  }
}

// Export singleton instance
export const database = new DatabaseManager();
export default database; 