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

// Basic Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// NOTE: Do NOT call app.listen() in a serverless environment like Vercel.
// Export the Express app so Vercel (@vercel/node) can handle requests.
// Keep runtime-safe error logging but avoid exiting the process.
const path = require('path');
const fs = require('fs');

// Use process.cwd() for Vercel compatibility; writeable tmp dir for production
const dataPath = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'bams_structure.json')
  : path.join(__dirname, 'data', 'bams_structure.json');

// Create a function to read/write data
const readData = () => {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    console.error('Error reading data file:', error);
    return null;
  }
};

const writeData = (data) => {
  try {
    // In Vercel, write to /tmp directory which is writable
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at: http://127.0.0.1:${PORT}/api`);
  });
}

// Export the Express app so Vercel can use it as a serverless handler
module.exports = app;

// Optional: also expose read/write helpers for tests or other modules
module.exports.readData = readData;
module.exports.writeData = writeData;