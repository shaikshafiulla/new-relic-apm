const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function initializeDatabase() {
  // Create connection without specifying database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Read and execute SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
    const statements = sql.split(/;\s*$/m);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await connection.end();
  }
}

module.exports = initializeDatabase;