const express = require("express");
const cors = require('cors');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || "5555";
const app = express();

// Simulated database for demo purposes
const users = new Map();
const posts = new Map();

// Enhanced request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  const startTime = Date.now();

  logger.info({
    event: 'REQUEST_RECEIVED',
    message: '🌟 New incoming request',
    method: req.method,
    path: req.path,
    requestId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Log response after completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      event: 'REQUEST_COMPLETED',
      message: '✅ Request processed',
      method: req.method,
      path: req.path,
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

app.use(cors());
app.use(express.json());

// User Management Endpoints
app.post('/users', (req, res) => {
  try {
    const { username, email, age } = req.body;
    
    // Validation
    const errors = [];
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (age && (isNaN(age) || age < 0)) errors.push('Invalid age');

    if (errors.length > 0) {
      logger.warn({
        event: 'VALIDATION_FAILED',
        message: '⚠️ User creation validation failed',
        requestId: req.requestId,
        errors,
        userData: { username, email, age }
      });
      return res.status(400).json({ errors });
    }

    const userId = uuidv4();
    const user = { id: userId, username, email, age, createdAt: new Date() };
    users.set(userId, user);

    logger.info({
      event: 'USER_CREATED',
      message: '👤 New user created successfully',
      requestId: req.requestId,
      userId,
      username
    });

    res.status(201).json(user);
  } catch (error) {
    logger.error({
      event: 'USER_CREATION_ERROR',
      message: '❌ Error creating user',
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Posts Management Endpoints
app.post('/posts', (req, res) => {
  try {
    const { userId, title, content } = req.body;

    if (!users.has(userId)) {
      logger.warn({
        event: 'POST_CREATION_FAILED',
        message: '⚠️ Post creation failed - User not found',
        requestId: req.requestId,
        userId
      });
      return res.status(404).json({ error: 'User not found' });
    }

    const postId = uuidv4();
    const post = {
      id: postId,
      userId,
      title,
      content,
      createdAt: new Date(),
      likes: 0
    };
    posts.set(postId, post);

    logger.info({
      event: 'POST_CREATED',
      message: '📝 New post created',
      requestId: req.requestId,
      postId,
      userId
    });

    res.status(201).json(post);
  } catch (error) {
    logger.error({
      event: 'POST_CREATION_ERROR',
      message: '❌ Error creating post',
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Performance Testing Endpoint
app.get('/performance-test/:scenario', async (req, res) => {
  const startTime = Date.now();
  const scenario = req.params.scenario;

  logger.info({
    event: 'PERFORMANCE_TEST_STARTED',
    message: '🚀 Starting performance test',
    requestId: req.requestId,
    scenario,
    startTime: new Date().toISOString()
  });

  try {
    switch (scenario) {
      case 'cpu-intensive':
        // Simulate CPU-intensive task
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sqrt(i);
        }
        break;

      case 'memory-intensive':
        // Simulate memory-intensive task
        const largeArray = new Array(1000000).fill('test');
        break;

      case 'async-operations':
        // Simulate multiple async operations
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 100)),
          new Promise(resolve => setTimeout(resolve, 200)),
          new Promise(resolve => setTimeout(resolve, 300))
        ]);
        break;

      default:
        throw new Error('Invalid scenario');
    }

    const duration = Date.now() - startTime;
    logger.info({
      event: 'PERFORMANCE_TEST_COMPLETED',
      message: '✅ Performance test completed',
      requestId: req.requestId,
      scenario,
      duration: `${duration}ms`,
      endTime: new Date().toISOString()
    });

    res.json({ 
      scenario, 
      duration: `${duration}ms`,
      result: 'Success'
    });

  } catch (error) {
    logger.error({
      event: 'PERFORMANCE_TEST_FAILED',
      message: '❌ Performance test failed',
      requestId: req.requestId,
      scenario,
      error: error.message,
      duration: `${Date.now() - startTime}ms`
    });
    res.status(500).json({ error: 'Performance test failed' });
  }
});

// Error Simulation Endpoints
app.get('/simulate-error/:type', (req, res) => {
  const errorType = req.params.type;

  logger.info({
    event: 'ERROR_SIMULATION_STARTED',
    message: '🔄 Starting error simulation',
    requestId: req.requestId,
    errorType
  });

  try {
    switch (errorType) {
      case 'reference':
        // ReferenceError
        nonExistentVariable.toString();
        break;

      case 'type':
        // TypeError
        const num = 42;
        num.split('');
        break;

      case 'syntax':
        // SyntaxError simulation
        eval('if (true) {');
        break;

      case 'custom':
        throw new Error('Custom application error');

      default:
        throw new Error('Unknown error type');
    }
  } catch (error) {
    logger.error({
      event: 'ERROR_SIMULATION_TRIGGERED',
      message: '💥 Simulated error occurred',
      requestId: req.requestId,
      errorType,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Simulated error',
      type: errorType,
      message: error.message
    });
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  logger.info({
    event: 'HEALTH_CHECK',
    message: '💓 Health check performed',
    requestId: req.requestId,
    health
  });

  res.json(health);
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error({
    event: 'UNHANDLED_ERROR',
    message: '🚨 Unhandled application error',
    requestId: req.requestId || 'unknown',
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.requestId || 'unknown',
    message: err.message
  });
});

// Start server with enhanced logging
const server = app.listen(parseInt(PORT, 10), () => {
  logger.info({
    event: 'SERVER_STARTED',
    message: '🚀 Server successfully started',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memory: process.memoryUsage()
  });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.warn({
    event: 'SHUTDOWN_INITIATED',
    message: '🔄 SIGTERM received. Initiating graceful shutdown',
    timestamp: new Date().toISOString()
  });

  server.close(() => {
    logger.info({
      event: 'SERVER_STOPPED',
      message: '🛑 Server stopped gracefully',
      timestamp: new Date().toISOString()
    });
    process.exit(0);
  });
});