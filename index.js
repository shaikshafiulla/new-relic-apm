require('dotenv').config();
require('newrelic');

const express = require('express');
const mysql = require('mysql2');
const initializeDatabase = require('./db-init');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });

  next();
});

initializeDatabase().then(() => {
  logger.info('Database initialization completed');
  
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'express_monitor',
    waitForConnections: true,
    enableKeepAlive: true
  });

  logger.info('MySQL connection pool created');

  app.get('/users', (req, res) => {
    const queryStart = Date.now();
    
    logger.info('Executing users query');
    
    pool.query('SELECT * FROM users', (err, results) => {
      const queryDuration = Date.now() - queryStart;
      
      if (err) {
        logger.error('Database query failed', {
          error: err.message,
          stack: err.stack,
          query: 'SELECT * FROM users',
          duration: `${queryDuration}ms`
        });
        return res.status(500).json({ error: 'Database error' });
      }

      logger.info('Database query successful', {
        query: 'SELECT * FROM users',
        duration: `${queryDuration}ms`,
        resultCount: results.length
      });
      
      res.json({
        success: true,
        data: results,
        meta: {
          count: results.length,
          queryTime: `${queryDuration}ms`
        }
      });
    });
  });

  app.get('/health', (req, res) => {
    logger.info('Health check requested');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/test-logs', (req, res) => {
    logger.debug('Debug message from test endpoint');
    logger.info('Info message from test endpoint');
    logger.warn('Warning message from test endpoint');
    logger.error('Error message from test endpoint (this is just a test)');
    
    res.json({
      message: 'Test logs generated',
      levels: ['debug', 'info', 'warn', 'error']
    });
  });

  app.use((err, req, res, next) => {
    logger.error('Unhandled application error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  });

  app.listen(PORT, () => {
    logger.info('Server started successfully', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      newRelicApp: process.env.NEW_RELIC_APP_NAME
    });
    console.log(`Server running on port ${PORT}`);
  });

}).catch(error => {
  logger.error('Failed to initialize application', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});