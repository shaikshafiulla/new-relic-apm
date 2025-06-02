require('dotenv').config();
require('newrelic');

const express = require('express');
const mysql = require('mysql2');
const initializeDatabase = require('./db-init');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database before starting server
initializeDatabase().then(() => {
  // Create MySQL connection pool after initialization
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'express_monitor',
    waitForConnections: true,
    enableKeepAlive: true
  });

  // Test endpoint with DB query
  app.get('/users', (req, res) => {
    const start = Date.now();
    
    pool.query('SELECT * FROM users', (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error');
      }

      const duration = Date.now() - start;
      console.log(`Query executed in ${duration}ms`);
      
      res.json(results);
    });
  });

  // Simple health check
  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('New Relic application name:', process.env.NEW_RELIC_APP_NAME);
  });
});