#!/usr/bin/env tsx

import database from './database';

/**
 * Database initialization script
 * This script creates the database tables and seeds initial data
 */
const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // The database constructor already initializes tables
    // Let's seed some additional sample data
    console.log('📊 Seeding sample data...');
    
    database.seedData();
    
    // Get statistics to verify initialization
    const stats = database.getStats();
    console.log('📈 Database Statistics:');
    console.log(`   ├── Total Users: ${stats.totalUsers}`);
    console.log(`   ├── Active Users: ${stats.activeUsers}`);
    console.log(`   └── Departments: ${stats.departments.join(', ')}`);
    
    console.log('✅ Database initialization completed successfully!');
    console.log('');
    console.log('🎯 You can now start the server with:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    database.close();
    process.exit(0);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase; 