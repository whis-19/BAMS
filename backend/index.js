const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./src/routes/apiRoutes');
// Ensure HierarchyManager is initialized to load data on startup
const hierarchyManager = require('./src/core/HierarchyManager');

// Initialize services with HierarchyManager
const departmentServiceFactory = require('./src/services/departmentService');
const classServiceFactory = require('./src/services/classService');
const studentServiceFactory = require('./src/services/studentService');

const departmentService = departmentServiceFactory(hierarchyManager);
const classService = classServiceFactory(hierarchyManager);
const studentService = studentServiceFactory(hierarchyManager);

// Export services globally for controllers to use
global.departmentService = departmentService;
global.classService = classService;
global.studentService = studentService;
global.hierarchyManager = hierarchyManager;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json()); // To parse application/json requests

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve static files for the frontend (index.html, css, js)
app.use(express.static('frontend')); 

// Catch-all route for other GET requests (can serve index.html for SPA if needed)
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'frontend' });
});

// Basic Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Hierarchy Manager initialized and data loaded.');
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Data path configuration
const path = require('path');
const fs = require('fs');

// Determine the base directory for data
const getDataPath = (filename) => {
  const isVercel = process.env.VERCEL === '1';
  const baseDir = isVercel 
    ? path.join('/tmp', 'backend', 'data')
    : path.join(__dirname, 'data');
    
  // Create directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  return path.join(baseDir, filename);
};

// Data file paths
const DATA_FILES = {
  structure: getDataPath('bams_structure.json'),
  // Add other data files here if needed
};

// Data access functions
const readData = (type = 'structure') => {
  try {
    const filePath = DATA_FILES[type];
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist in /tmp, copy from original location (Vercel)
      if (process.env.VERCEL === '1' && !filePath.includes('/tmp')) {
        const originalPath = path.join(__dirname, 'data', `${type}.json`);
        if (fs.existsSync(originalPath)) {
          const data = fs.readFileSync(originalPath, 'utf8');
          writeData(type, JSON.parse(data));
          return JSON.parse(data);
        }
      }
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${type} data:`, error);
    return null;
  }
};

const writeData = (type = 'structure', data) => {
  try {
    const filePath = DATA_FILES[type];
    const dir = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${type} data:`, error);
    return false;
  }
};

// Make data functions available globally
global.readData = readData;
global.writeData = writeData;