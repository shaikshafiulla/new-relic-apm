const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

async function initializeDatabase() {
  logger.info('Starting database initialization');
  
  // Create connection without specifying database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  logger.info('Database connection established', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root'
  });

  try {
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'init.sql');
    logger.info('Reading SQL initialization file', { path: sqlPath });
    
    const sql = fs.readFileSync(sqlPath).toString();
    const statements = sql.split(/;\s*$/m);
    
    logger.info('Executing SQL statements', { count: statements.filter(s => s.trim()).length });
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
        logger.debug('SQL statement executed', { statement: statement.trim().substring(0, 100) + '...' });
      }
    }
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await connection.end();
    logger.info('Database connection closed');
  }
}

module.exports = initializeDatabase;